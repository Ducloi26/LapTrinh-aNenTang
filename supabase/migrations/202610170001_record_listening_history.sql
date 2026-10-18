-- Use the existing table and columns only. Do not create tables or add columns.
-- mood_id/stage are optional; both journey_id and the legacy jouney_id are supported.
begin;

create unique index if not exists listening_history_user_playback_uidx
  on public.listening_history (user_id, playback_id);

create or replace function public.record_listening_history(
  p_playback_id text,
  p_user_id uuid,
  p_track_id uuid,
  p_listened_sec integer,
  p_duration_sec double precision,
  p_end_reason text,
  p_played_at timestamptz,
  p_journey_id uuid default null,
  p_mood_id text default null,
  p_stage text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_history_id text;
  v_journey_column text;
  v_columns text;
  v_values text := '$1, $2, $3, $4, $5, $6, $7, $8';
begin
  -- Use the authenticated identity, never a caller-selected user.
  if v_user_id is null or p_user_id is distinct from v_user_id then
    raise exception 'Authentication required for this user' using errcode = '42501';
  end if;
  if p_listened_sec is null or p_listened_sec < 0 or p_listened_sec > 86400 then
    raise exception 'Invalid listened_sec' using errcode = '22023';
  end if;
  if p_listened_sec < 5 then
    return jsonb_build_object('recorded', false, 'reason', 'under_5_seconds');
  end if;
  if p_playback_id is null or length(p_playback_id) not between 8 and 150
    or p_duration_sec is null or not (p_duration_sec > 0 and p_duration_sec <= 86400)
    or p_end_reason is null or p_end_reason not in ('ended', 'changed', 'stopped', 'error', 'signed_out')
    or p_played_at is null or p_played_at > now() + interval '5 minutes'
    or length(coalesce(p_mood_id, '')) > 100 or length(coalesce(p_stage, '')) > 200 then
    raise exception 'Invalid playback data' using errcode = '22023';
  end if;
  if p_journey_id is not null and not exists (
    select 1 from public.journeys where id = p_journey_id and user_id = v_user_id
  ) then
    raise exception 'Journey does not belong to this user' using errcode = '42501';
  end if;

  -- Adapt to existing columns without changing the user's schema.
  select attname into v_journey_column
  from pg_catalog.pg_attribute
  where attrelid = 'public.listening_history'::regclass
    and attname in ('journey_id', 'jouney_id') and not attisdropped
  order by case when attname = 'journey_id' then 0 else 1 end
  limit 1;
  if v_journey_column is null then
    raise exception 'listening_history needs its existing journey_id or jouney_id column' using errcode = '42703';
  end if;
  v_columns := pg_catalog.format(
    'user_id, track_id, %I, listened_sec, completed, skipped, played_at, playback_id',
    v_journey_column
  );
  -- Keep metadata for databases that already have it, but never require new columns.
  if exists (select 1 from pg_catalog.pg_attribute
    where attrelid = 'public.listening_history'::regclass and attname = 'mood_id' and not attisdropped) then
    v_columns := v_columns || ', mood_id';
    v_values := v_values || ', $9';
  end if;
  if exists (select 1 from pg_catalog.pg_attribute
    where attrelid = 'public.listening_history'::regclass and attname = 'stage' and not attisdropped) then
    v_columns := v_columns || ', stage';
    v_values := v_values || ', $10';
  end if;
  -- Only allowlisted column names are interpolated; all playback values are bound.
  execute pg_catalog.format(
    'insert into public.listening_history (%s) values (%s)
     on conflict (user_id, playback_id) do nothing returning id::text',
    v_columns, v_values
  ) into v_history_id using
    v_user_id, p_track_id, p_journey_id, p_listened_sec,
    p_listened_sec >= p_duration_sec * 0.8,
    p_end_reason in ('changed', 'stopped') and p_listened_sec < 30,
    p_played_at, p_playback_id, p_mood_id, p_stage;

  if v_history_id is null then
    return jsonb_build_object('recorded', false, 'reason', 'already_recorded');
  end if;

  -- This increment locks the row and cannot lose another listener's increment.
  -- A failure rolls back the history insert as part of the same transaction.
  update public.tracks set play_count = coalesce(play_count, 0) + 1 where id = p_track_id;
  if not found then
    raise exception 'Track does not exist' using errcode = '23503';
  end if;
  return jsonb_build_object('recorded', true, 'id', v_history_id);
end;
$$;

revoke all on function public.record_listening_history(text, uuid, uuid, integer, double precision, text, timestamptz, uuid, text, text) from public, anon;
grant execute on function public.record_listening_history(text, uuid, uuid, integer, double precision, text, timestamptz, uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
commit;
