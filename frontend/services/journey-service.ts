import { ACTIVITIES, JOURNEY_4_STAGES, Track, isActivityId, isDurationMinutes, isMoodId, moodById } from '@/constants/moodflow';
import { request } from './api-client';
import { Journey, Stage } from './journey-generator';

export interface SavedJourney {
  id: string;
  title: string;
  mood_from: string;
  mood_to: string;
  activity: string;
  duration_minutes: number;
  stages: Stage[];
  created_at?: string;
  unavailable_track_count?: number;
  is_public: boolean;
  share_version: number;
  updated_at?: string | null;
  avg_bpm?: number;
}


export async function getJourneyTracks(signal?: AbortSignal): Promise<Track[]> {
  const { data } = await request<{ data: Track[] }>('/tracks', { signal }, false);
  if (!Array.isArray(data) || !data.length) throw new Error('Catalog DB chưa có bài hát để tạo hành trình.');
  return data;
}

export function restoreJourney(saved: SavedJourney): Journey {
  if (!isMoodId(saved.mood_from) || !isMoodId(saved.mood_to)
    || !isActivityId(saved.activity) || !isDurationMinutes(saved.duration_minutes)
    || !Array.isArray(saved.stages) || saved.stages.length !== 4
    || saved.stages.some((stage, index) => stage?.key !== JOURNEY_4_STAGES[index].key || !Array.isArray(stage.tracks))) {
    throw new Error('Hành trình trong DB không đúng đặc tả.');
  }
  return {
    id: saved.id, title: saved.title, totalMin: saved.duration_minutes,
    isPublic: saved.is_public === true, shareVersion: saved.share_version,
    moodFrom: moodById(saved.mood_from), moodTo: moodById(saved.mood_to),
    activityId: saved.activity, activityLabel: ACTIVITIES.find((item) => item.id === saved.activity)!.label,
    stages: saved.stages.map((stage, index) => ({ ...stage,
      title: JOURNEY_4_STAGES[index].title, emoji: JOURNEY_4_STAGES[index].emoji,
      subtitle: JOURNEY_4_STAGES[index].subtitle,
    })), saveStatus: 'saved',
    saveError: saved.unavailable_track_count
      ? `${saved.unavailable_track_count} bài hát trong hành trình không còn khả dụng trong catalog DB.` : undefined,
  };
}

export async function saveJourney(journey: Journey, signal?: AbortSignal): Promise<Journey> {
  if (journey.stages.some((stage) => stage.tracks.some((track) => !track.id))) {
    throw new Error('Hành trình dùng bài mẫu chưa có ID DB. Hãy tạo lại từ catalog DB để lưu.');
  }
  const { journey: saved } = await request<{ journey: SavedJourney }>('/journeys', {
    method: 'POST',
    signal,
    body: JSON.stringify({
      title: journey.title || `${journey.moodFrom.emoji} ${journey.moodFrom.label} ➔ ${journey.moodTo.emoji} ${journey.moodTo.label}`,
      moodFrom: journey.moodFrom, moodTo: journey.moodTo, activity: journey.activityId,
      duration: journey.totalMin, stages: journey.stages,
    }),
  });
  return restoreJourney(saved);
}

export async function getSavedJourneys(signal?: AbortSignal): Promise<SavedJourney[]> {
  const { data } = await request<{ data: SavedJourney[] }>('/journeys/my', { signal });
  if (!Array.isArray(data)) throw new Error('Dữ liệu thư viện không hợp lệ.');
  return data;
}

export async function deleteJourney(id: string): Promise<void> {
  await request(`/journeys/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export type JourneyPrivacy = Pick<SavedJourney, 'is_public' | 'share_version' | 'updated_at'>;

export async function updateJourneyPrivacy(id: string, visibility: 'private' | 'public',
  expected: JourneyPrivacy, signal?: AbortSignal): Promise<JourneyPrivacy> {
  const result = await request<{ privacy: JourneyPrivacy }>(`/journeys/${encodeURIComponent(id)}/privacy`, {
    method: 'PATCH', signal, body: JSON.stringify({ visibility,
      expectedVisibility: expected.is_public ? 'public' : 'private', expectedShareVersion: expected.share_version }),
  });
  if (typeof result.privacy?.is_public !== 'boolean' || !Number.isSafeInteger(result.privacy.share_version)
    || result.privacy.share_version < 0) throw new Error('Không xác nhận được quyền hành trình. Hãy tải lại thư viện.');
  return result.privacy;
}

export async function getJourneyStatistics() {
  const { data } = await request<{ data: Record<string, unknown> }>('/stats');
  return data;
}

export async function saveCommunityJourney(postId: string): Promise<void> {
  await request(`/community/posts/${encodeURIComponent(postId)}/save`, { method: 'POST', body: '{}' });
}
