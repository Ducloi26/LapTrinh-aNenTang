import { supabase } from '@/lib/supabase';
import { MOODS, ACTIVITIES, Mood, Activity } from '@/constants/moodflow';

const BACKEND_URL = 'http://localhost:5000';

/**
 * Service kết nối dữ liệu Cảm xúc (Moods) từ Máy chủ Backend Express (với fallback Supabase)
 */
export async function getMoodsFromBackend(): Promise<Mood[]> {
  try {
    // 1. Thử gọi API từ máy chủ Backend Node.js Express
    const res = await fetch(`${BACKEND_URL}/api/moods`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        return json.data.map((m: any) => ({
          id: m.id,
          label: m.label,
          emoji: m.emoji,
          colors: typeof m.colors === 'string' ? JSON.parse(m.colors) : m.colors,
          line: m.tagline,
          targetEnergy: m.target_energy ?? 50,
          targetValence: m.target_valence ?? 50,
        }));
      }
    }
  } catch (e) {
    // Nếu chưa bật backend express, fallback xuống bước 2
  }

  try {
    // 2. Fallback trực tiếp tới Supabase
    const { data, error } = await supabase
      .from('moods')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((m: any) => ({
        id: m.id,
        label: m.label,
        emoji: m.emoji,
        colors: typeof m.colors === 'string' ? JSON.parse(m.colors) : m.colors,
        line: m.tagline,
        targetEnergy: m.target_energy ?? 50,
        targetValence: m.target_valence ?? 50,
      }));
    }
  } catch (e) {}

  // 3. Fallback hằng số Tiếng Việt
  return MOODS;
}

/**
 * Service kết nối Hoạt động (Activities) từ Máy chủ Backend Express (với fallback Supabase)
 */
export async function getActivitiesFromBackend(): Promise<Activity[]> {
  try {
    // 1. Thử gọi API từ máy chủ Backend Node.js Express
    const res = await fetch(`${BACKEND_URL}/api/activities`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        return json.data.map((a: any) => ({
          id: a.id,
          label: a.label,
          icon: a.icon,
        }));
      }
    }
  } catch (e) {}

  try {
    // 2. Fallback trực tiếp tới Supabase
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((a: any) => ({
        id: a.id,
        label: a.label,
        icon: a.icon,
      }));
    }
  } catch (e) {}

  return ACTIVITIES;
}

/**
 * Lấy hồ sơ người dùng thực tế từ Backend Express JWT Token hoặc Supabase
 */
export async function getCurrentUserProfile(): Promise<{ displayName: string; email?: string } | null> {
  // 1. Kiểm tra tài khoản đã lưu từ phiên Backend Express JWT
  if (typeof localStorage !== 'undefined') {
    const savedUserStr = localStorage.getItem('moodflow_user');
    const token = localStorage.getItem('moodflow_token');
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        if (u?.displayName) {
          return { displayName: u.displayName, email: u.email };
        }
      } catch (e) {}
    }

    if (token) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.user) {
            return {
              displayName: json.user.displayName,
              email: json.user.email,
            };
          }
        }
      } catch (e) {}
    }
  }

  // 2. Fallback kiểm tra session Supabase Cloud
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
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
    }
  } catch (e) {}

  return null;
}
