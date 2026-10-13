import { supabase } from '@/lib/supabase';
import {
  MOODS, ACTIVITIES, Mood, Activity, GradientColors, isMoodId, isActivityId,
} from '@/constants/moodflow';

type CatalogReason = 'FETCH_ERROR' | 'INVALID_CATALOG' | 'NULL_DEFAULT';

function diagnose(reason: CatalogReason): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn(reason);
}

const isText = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const isInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value);
const isColors = (value: unknown): value is GradientColors =>
  Array.isArray(value) && value.length >= 2 && value.length <= 4
  && value.every((color) => typeof color === 'string' && /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(color));

async function loadCatalog<T extends { id: string }>(
  table: 'moods' | 'activities',
  fallback: T[],
  mapRow: (row: Record<string, unknown>) => T | null,
): Promise<T[]> {
  const reject = (reason: CatalogReason) => {
    diagnose(reason);
    return fallback;
  };

  let rows: unknown;
  try {
    const { data, error } = await supabase.from(table).select('*').order('display_order', { ascending: true });
    if (error) return reject('FETCH_ERROR');
    rows = data;
  } catch {
    return reject('FETCH_ERROR');
  }

  if (!Array.isArray(rows) || rows.length !== fallback.length) return reject('INVALID_CATALOG');
  const seen = new Set<string>();
  const mapped: { item: T; order: number }[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return reject('INVALID_CATALOG');
    const order = row.display_order;
    if (order !== null && !isInteger(order)) return reject('INVALID_CATALOG');
    const item = mapRow(row);
    if (!item || seen.has(item.id)) return reject('INVALID_CATALOG');
    seen.add(item.id);
    mapped.push({ item, order: order ?? Infinity });
  }
  if (fallback.some((item) => !seen.has(item.id))) return reject('INVALID_CATALOG');
  const rank = new Map(fallback.map((item, index) => [item.id, index]));
  return mapped.sort((a, b) =>
    (a.order - b.order) || rank.get(a.item.id)! - rank.get(b.item.id)!,
  ).map(({ item }) => item);
}

export async function getMoodsFromBackend(): Promise<Mood[]> {
  return loadCatalog('moods', MOODS, (m) => {
    let colors: unknown = m.colors;
    if (typeof colors === 'string') {
      if (colors.length > 256) return null;
      try { colors = JSON.parse(colors); } catch { return null; }
    }
    if (!isMoodId(m.id) || !isText(m.label, 100) || !isText(m.emoji, 16)
      || !isText(m.tagline, 300) || !isColors(colors)
      || !isInteger(m.target_energy) || m.target_energy < 0 || m.target_energy > 100
      || !isInteger(m.target_valence) || m.target_valence < 0 || m.target_valence > 100) return null;

    return {
      id: m.id, label: m.label, emoji: m.emoji, colors, line: m.tagline,
      targetEnergy: m.target_energy, targetValence: m.target_valence,
    };
  });
}

export async function getActivitiesFromBackend(): Promise<Activity[]> {
  return loadCatalog('activities', ACTIVITIES, (a) => {
    if (!isActivityId(a.id) || !isText(a.label, 100)
      || !ACTIVITIES.some((activity) => activity.icon === a.icon)
      || !isInteger(a.target_bpm_min) || !isInteger(a.target_bpm_max)
      || a.target_bpm_min <= 0 || a.target_bpm_min > a.target_bpm_max
      || (a.allow_vocal !== null && typeof a.allow_vocal !== 'boolean')) return null;
    if (a.allow_vocal === null) diagnose('NULL_DEFAULT');

    return {
      id: a.id, label: a.label, icon: a.icon as string,
      bpmRange: [a.target_bpm_min, a.target_bpm_max], allowLyrics: a.allow_vocal ?? true,
    };
  });
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
