import {
  ACTIVITIES,
  JOURNEY_4_STAGES,
  ActivityId,
  MoodId,
  isActivityId,
  isMoodId,
  moodById,
} from '@/constants/moodflow';
import { supabase } from '@/lib/supabase';
import { Journey, Stage, fmtMin } from '@/services/journey-generator';

type Relation<T> = T | T[] | null;

interface DiscoverTrackRow {
  id: string;
  title: string;
  genre: string;
  duration_sec: number;
  cover_url: string;
  audio_url: string;
  play_count: number | string | null;
  deleted_at: string | null;
  artists: Relation<{ name: string }>;
  track_features: Relation<{
    bpm: number | null;
    energy: number | null;
    valence: number | null;
    psychological_effect: string | null;
  }>;
}

interface JourneyTrackRow {
  position: number;
  stage_key: string;
  tracks: Relation<DiscoverTrackRow>;
}

interface DiscoverJourneyRow {
  id: string;
  title: string;
  mood_from: string;
  mood_to: string;
  activity: string;
  duration_min: number;
  app_users: Relation<{ display_name: string }>;
  journey_tracks: JourneyTrackRow[] | null;
}

export interface DiscoverJourney {
  id: string;
  title: string;
  creator: string;
  moodFrom: MoodId;
  moodTo: MoodId;
  activity: ActivityId;
  activityLabel: string;
  durationMinutes: number;
  listenCount: number;
  tracks: { title: string; artist: string }[];
  journey: Journey;
}

function first<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function durationLabel(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function toJourney(row: DiscoverJourneyRow): DiscoverJourney {
  if (!isMoodId(row.mood_from) || !isMoodId(row.mood_to) || !isActivityId(row.activity)
    || !Number.isFinite(row.duration_min) || row.duration_min <= 0) {
    throw new Error(`Hành trình "${row.title}" có dữ liệu tâm trạng, hoạt động hoặc thời lượng không hợp lệ.`);
  }

  const rows = [...(row.journey_tracks ?? [])].sort((a, b) => a.position - b.position);
  const tracks = new Map<string, ReturnType<typeof mapTrack>>();
  for (const item of rows) {
    const track = first(item.tracks);
    if (!track || track.deleted_at) continue;
    tracks.set(track.id, mapTrack(track));
  }

  const activity = ACTIVITIES.find((item) => item.id === row.activity)!;
  let elapsed = 0;
  const stages: Stage[] = JOURNEY_4_STAGES.map((template, index) => {
    const startMin = elapsed;
    elapsed = index === JOURNEY_4_STAGES.length - 1
      ? row.duration_min
      : elapsed + row.duration_min * template.share;
    const stageTracks = rows
      .filter((item) => item.stage_key === template.key)
      .map((item) => {
        const track = first(item.tracks);
        return track ? tracks.get(track.id) : undefined;
      })
      .filter((track): track is NonNullable<typeof track> => !!track);

    return {
      key: template.key,
      emoji: template.emoji,
      title: template.title,
      subtitle: template.subtitle,
      startMin,
      endMin: elapsed,
      range: `${fmtMin(startMin)} – ${fmtMin(elapsed)}`,
      tracks: stageTracks,
    };
  });

  const selectedTracks = [...tracks.values()];
  const totalListens = selectedTracks.reduce((total, track) => total + track.playCount, 0);
  const creator = first(row.app_users)?.display_name?.trim();
  const journey: Journey = {
    title: row.title,
    stages,
    totalMin: row.duration_min,
    moodFrom: moodById(row.mood_from),
    moodTo: moodById(row.mood_to),
    activityLabel: activity.label,
    activityId: activity.id,
  };

  return {
    id: row.id,
    title: row.title,
    creator: creator || 'Người nghe MoodFlow',
    moodFrom: row.mood_from,
    moodTo: row.mood_to,
    activity: activity.id,
    activityLabel: activity.label,
    durationMinutes: row.duration_min,
    listenCount: totalListens,
    tracks: selectedTracks.map(({ title, artist }) => ({ title, artist })),
    journey,
  };
}

function mapTrack(row: DiscoverTrackRow) {
  const artist = first(row.artists);
  const features = first(row.track_features);
  const duration = Number.isFinite(row.duration_sec) ? row.duration_sec : 0;
  const playCount = Number(row.play_count ?? 0);

  return {
    id: row.id,
    title: row.title,
    artist: artist?.name || 'Chưa rõ nghệ sĩ',
    genre: row.genre,
    energy: features?.energy ?? 50,
    valence: features?.valence ?? 50,
    duration: durationLabel(duration),
    cover: row.cover_url,
    audioUrl: row.audio_url,
    bpm: features?.bpm ?? 80,
    psychologicalEffect: features?.psychological_effect ?? undefined,
    playCount: Number.isFinite(playCount) && playCount > 0 ? playCount : 0,
  };
}

export async function getPublicDiscoverJourneys(signal?: AbortSignal): Promise<DiscoverJourney[]> {
  const { data, error } = await supabase
    .from('journeys')
    .select(
      'id,title,mood_from,mood_to,activity,duration_min,app_users!journeys_user_id_fkey(display_name),journey_tracks(position,stage_key,tracks(id,title,genre,duration_sec,cover_url,audio_url,play_count,deleted_at,artists(name),track_features(bpm,energy,valence,psychological_effect)))'
    )
    .eq('is_public', true)
    .is('deleted_at', null)
    .order('saves_count', { ascending: false })
    .limit(60)
    .abortSignal(signal ?? new AbortController().signal)
    .returns<DiscoverJourneyRow[]>();

  if (error) throw new Error(`Không tải được hành trình khám phá: ${error.message}`);
  return (data ?? []).map(toJourney);
}

export function formatCount(count: number | string | null | undefined): string {
  const value = Number(count);
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} N`;
  }
  return Math.floor(value).toLocaleString('vi-VN');
}

export function calculateMatchScore(
  journey: Pick<DiscoverJourney, 'moodFrom' | 'moodTo' | 'activity'>,
  preferredMood?: string | null,
  preferredActivity?: string | null,
): number {
  const hasMood = isMoodId(preferredMood);
  const hasActivity = isActivityId(preferredActivity);
  if (!hasMood && !hasActivity) return 0;

  const moodScore = hasMood
    ? journey.moodFrom === preferredMood ? 100 : journey.moodTo === preferredMood ? 75 : 0
    : 0;
  const activityScore = hasActivity && journey.activity === preferredActivity ? 100 : 0;
  const moodWeight = hasMood ? 0.6 : 0;
  const activityWeight = hasActivity ? 0.4 : 0;
  const totalWeight = moodWeight + activityWeight;

  return Math.round((moodScore * moodWeight + activityScore * activityWeight) / totalWeight);
}
