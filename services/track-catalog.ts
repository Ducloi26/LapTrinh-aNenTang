import { supabase } from '../lib/supabase';
import { Track, TRACK_POOL } from '../constants/moodflow';
import { getSupabaseConfigurationError } from '../lib/supabase-config';

type TrackRow = Record<string, unknown>;
export interface MusicCatalog {
  tracks: Track[];
  pools: Record<string, Track[]>;
}

function durationLabel(value: unknown): string {
  if (typeof value === 'string' && /^\d+:\d{2}$/.test(value)) return value;
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function mapTrackCatalog(rows: TrackRow[]): MusicCatalog {
  const pools: Record<string, Track[]> = {};
  const tracks: Track[] = [];
  for (const row of rows) {
    if (typeof row.audio_url !== 'string' || !row.audio_url.trim()) continue;
    const energyValue = Number(row.energy ?? 50);
    const energy = Number.isFinite(energyValue) ? Math.max(0, Math.min(100, energyValue)) : 50;
    const track: Track = {
      id: row.id == null ? undefined : String(row.id),
      title: String(row.title || 'Bài hát'),
      artist: String(row.artist || row.artist_name || 'Nghệ sĩ'),
      genre: String(row.genre || 'Music'),
      duration: durationLabel(row.duration ?? row.duration_seconds ?? row.duration_sec),
      cover: String(row.cover_url || TRACK_POOL.focus[0].cover),
      audioUrl: row.audio_url.trim(),
      energy,
      bpm: Number(row.tempo_bpm ?? row.bpm) || undefined,
    };
    const pool = typeof row.pool_key === 'string' ? row.pool_key : energy < 35 ? 'calmdown' : energy > 65 ? 'energize' : 'focus';
    (pools[pool] ??= []).push(track);
    tracks.push(track);
  }
  // Small catalogs may not yet have songs for all journey stages.
  for (const key of Object.keys(TRACK_POOL)) {
    if (!pools[key]?.length) pools[key] = tracks;
  }
  return { tracks, pools };
}

export function describeCatalogError(error: { code?: string; message?: string }, status: number, timedOut = false): string {
  if (timedOut) return 'Kết nối Supabase quá 15 giây. Kiểm tra mạng rồi bấm Tải lại thư viện.';
  if (!status || /failed to fetch|network request failed|fetch failed/i.test(error.message || '')) {
    return 'Không kết nối được Supabase. Kiểm tra mạng, URL dự án trong .env và khởi động lại Expo nếu vừa sửa cấu hình.';
  }
  if (status === 401) {
    if (/expired|jwt/i.test(error.message || '')) return 'Phiên đăng nhập Supabase không hợp lệ hoặc đã hết hạn. Đăng xuất và đăng nhập lại.';
    return 'Supabase từ chối API key. Kiểm tra URL và public API key thuộc cùng dự án trong .env rồi khởi động lại Expo.';
  }
  if (status === 403 || error.code === '42501') return 'Tài khoản hiện tại chưa có quyền SELECT bảng tracks. Kiểm tra quyền đọc và chính sách RLS trên Supabase.';
  if (status === 404 || error.code === 'PGRST205') return 'Không tìm thấy bảng public.tracks trong dự án Supabase đang kết nối. Kiểm tra URL dự án và tên bảng.';
  const code = error.code ? ` (${error.code})` : '';
  return `Không đọc được bảng tracks${code}: ${error.message || `HTTP ${status}`}`;
}

export async function loadMusicCatalog(): Promise<MusicCatalog> {
  const configurationError = getSupabaseConfigurationError(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  );
  if (configurationError) throw new Error(configurationError);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const { data, error, status } = await supabase.from('tracks').select('*').limit(500).abortSignal(controller.signal);
    if (error) throw new Error(describeCatalogError(error, status, controller.signal.aborted));
    const catalog = mapTrackCatalog(data ?? []);
    if (!catalog.tracks.length) throw new Error('Chưa có bài hát có audio_url trong bảng tracks hoặc tài khoản chưa có quyền đọc.');
    return catalog;
  } finally {
    clearTimeout(timeout);
  }
}
