begin;
-- Audius supplies BPM, but not energy/valence. NULL means genuinely unknown.
alter table public.track_features alter column energy drop not null;
alter table public.track_features alter column valence drop not null;
grant usage on schema public to service_role;
grant select on public.artists, public.tracks, public.track_features to service_role;
grant insert (id, name), update (id, name) on public.artists to service_role;
grant insert (id, artist_id, title, genre, duration_sec, cover_url, audio_url),
      update (id, artist_id, title, genre, duration_sec, cover_url, audio_url)
on public.tracks to service_role;
grant insert (track_id, bpm, energy, valence, acousticness, instrumentalness, vocal_intensity, vocal_density, is_estimated)
on public.track_features to service_role;
notify pgrst, 'reload schema';
commit;
