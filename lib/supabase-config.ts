export function getSupabaseConfigurationError(url?: string, key?: string): string | null {
  if (!url || !key) return 'Thiếu cấu hình Supabase trong .env. Điền EXPO_PUBLIC_SUPABASE_URL và EXPO_PUBLIC_SUPABASE_ANON_KEY rồi khởi động lại Expo.';
  if (/your[-_]?project|project[-_]?id|<|>/i.test(url) || /^(YOUR_|YOUR-)/i.test(key)) {
    return 'Cấu hình Supabase trong .env vẫn là giá trị mẫu. Điền URL và public API key của dự án thật rồi khởi động lại Expo.';
  }
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Invalid protocol');
  } catch {
    return 'EXPO_PUBLIC_SUPABASE_URL trong .env không phải URL hợp lệ. Sửa cấu hình rồi khởi động lại Expo.';
  }
  return null;
}
