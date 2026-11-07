import { Track } from '@/constants/moodflow';
import { request } from '@/services/api-client';

export interface ListeningSummary {
  totalListeningSeconds: number;
  topGenre: string | null;
  topArtist: string | null;
  topMood: string | null;
}

export interface ListeningHistoryItem extends Track {
  historyId: number;
  listenedSec: number;
  completed: boolean;
  skipped: boolean;
  playedAt: string;
}

function firstText(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export async function getListeningSummary(signal?: AbortSignal): Promise<ListeningSummary> {
  const { data } = await request<{ data: Record<string, unknown> }>('/library/summary', { signal });
  if (!data || typeof data !== 'object') throw new Error('Dữ liệu thống kê nghe nhạc không hợp lệ.');
  const rawSeconds = data.total_listening_seconds ?? data.total_listened_seconds ?? data.listened_seconds;
  const seconds = rawSeconds === undefined || rawSeconds === null ? Number.NaN : Number(rawSeconds);
  const hours = Number(data.total_listening_hours ?? data.total_hours ?? 0);
  return {
    totalListeningSeconds: Number.isFinite(seconds)
      ? Math.max(0, seconds)
      : Number.isFinite(hours) ? Math.max(0, hours * 3600) : 0,
    topGenre: firstText(data, ['top_genre', 'favorite_genre']),
    topArtist: firstText(data, ['top_artist', 'favorite_artist']),
    topMood: firstText(data, ['top_mood', 'top_mood_id', 'favorite_mood']),
  };
}

export async function getFavoriteTracks(signal?: AbortSignal): Promise<Track[]> {
  const { data } = await request<{ data: Track[] }>('/library/favorites', { signal });
  if (!Array.isArray(data)) throw new Error('Dữ liệu bài hát yêu thích không hợp lệ.');
  return data;
}

export async function removeFavoriteTrack(trackId: string, signal?: AbortSignal): Promise<void> {
  await request(`/library/favorites/${encodeURIComponent(trackId)}`, { method: 'DELETE', signal });
}

export async function getListeningHistory(signal?: AbortSignal): Promise<ListeningHistoryItem[]> {
  const { data } = await request<{ data: ListeningHistoryItem[] }>('/library/history', { signal });
  if (!Array.isArray(data)) throw new Error('Dữ liệu lịch sử nghe không hợp lệ.');
  return data;
}

export async function clearListeningHistory(signal?: AbortSignal): Promise<void> {
  await request('/library/history', { method: 'DELETE', signal });
}

export async function renameSavedJourney(
  id: string,
  title: string,
  signal?: AbortSignal,
): Promise<string> {
  const { journey } = await request<{ journey: { id: string; title: string } }>(
    `/journeys/${encodeURIComponent(id)}/title`,
    { method: 'PATCH', signal, body: JSON.stringify({ title }) },
  );
  if (journey?.id !== id || typeof journey.title !== 'string') {
    throw new Error('Không xác nhận được tên hành trình đã cập nhật.');
  }
  return journey.title;
}
