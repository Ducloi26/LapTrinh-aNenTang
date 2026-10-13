import { supabase } from '@/lib/supabase';
import { MOODS, ACTIVITIES, Mood, Activity } from '@/constants/moodflow';

/**
 * Service kết nối trực tiếp với Backend Supabase
 * Quản lý danh mục Cảm xúc (Moods) và Hoạt động (Activities)
 */
export async function getMoodsFromBackend(): Promise<Mood[]> {
  try {
    const { data, error } = await supabase
      .from('moods')
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      // Fallback về hằng số Tiếng Việt nếu chưa seed DB hoặc mất mạng
      return MOODS;
    }

    return data.map((m: any) => ({
      id: m.id,
      label: m.label,
      emoji: m.emoji,
      colors: typeof m.colors === 'string' ? JSON.parse(m.colors) : m.colors,
      line: m.tagline,
      targetEnergy: m.target_energy ?? 50,
      targetValence: m.target_valence ?? 50,
    }));
  } catch (e) {
    return MOODS;
  }
}

export async function getActivitiesFromBackend(): Promise<Activity[]> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return ACTIVITIES;
    }

    return data.map((a: any) => ({
      id: a.id,
      label: a.label,
      icon: a.icon,
    }));
  } catch (e) {
    return ACTIVITIES;
  }
}

/**
 * Lấy hồ sơ người dùng thực tế từ Backend Supabase
 */
export async function getCurrentUserProfile(): Promise<{ displayName: string; email?: string } | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const name = profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Người nghe';
    return {
      displayName: name,
      email: user.email,
    };
  } catch (e) {
    return null;
  }
}
