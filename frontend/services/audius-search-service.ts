import type { Track } from '@/constants/moodflow';
import { getBackendSession } from './backend-session';
export interface AudiusTrack {
  sourceId: string; title: string; artist: string; audioUrl: string; cover: string;
  durationSec: number; genre: string; shareUrl: string; licenseUrl: string;
}
export async function searchAudius(query: string, offset = 0): Promise<{
  data: AudiusTrack[]; nextOffset: number | null; testMode: boolean;
}> {
  const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/audius/search?q=${encodeURIComponent(query)}&offset=${offset}`);
  let result;
  try { result = await response.json(); } catch { throw new Error('Chưa có tìm kiếm Audius. Hãy khởi động lại backend.'); }
  if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error(result.error || 'Không tìm được nhạc Audius.');
  return result;
}
export function audiusToTrack(song: AudiusTrack): Track {
  const sec = Math.max(0, Math.floor(song.durationSec));
  // Audius IDs are not public.tracks UUIDs: never submit them as database IDs.
  return { audiusSourceId: song.sourceId, title: song.title, artist: song.artist, cover: song.cover, audioUrl: song.audioUrl,
    duration: `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, genre: song.genre, energy: 50 };
}

export async function prepareAudiusTrack(track: Track): Promise<Track> {
  if (!track.audiusSourceId) return track;
  const session = getBackendSession();
  if (!session) throw new Error('Đăng nhập để phát Audius và lưu lịch sử cho Music DNA.');
  const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/audius/tracks/${encodeURIComponent(track.audiusSourceId)}/import`, {
    method:'POST', headers:{Authorization:`Bearer ${session.token}`},
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || 'Không lưu được bài Audius.');
  return {...track,...result.data};
}
