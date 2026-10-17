import type { Track } from '../constants/moodflow';

export function resolveTrackSource(track: Track): string {
  if (track.audioUrl?.trim()) {
    const url = track.audioUrl.trim();
    if (/^https?:\/\/(www\.)?example\.(com|org|net)(\/|$)/i.test(url)) {
      throw new Error(`audio_url của “${track.title}” đang là link mẫu example.com. Thay bằng Public URL của MP3 trong Supabase Storage.`);
    }
    if (!/^https?:\/\//i.test(url)) throw new Error(`audio_url của “${track.title}” phải là URL HTTP hoặc HTTPS.`);
    return url;
  }
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  const bucket = track.storageBucket || process.env.EXPO_PUBLIC_MUSIC_BUCKET || 'music';
  if (!baseUrl || !track.storagePath) {
    throw new Error(`Bài “${track.title}” chưa có nguồn MP3. Cấu hình Supabase Storage hoặc audioUrl.`);
  }
  const path = track.storagePath.split('/').map(encodeURIComponent).join('/');
  return `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path}`;
}

export function trackKey(track: Track): string {
  return track.id || track.audioUrl || `${track.storageBucket || ''}/${track.storagePath || ''}/${track.artist}/${track.title}`;
}
