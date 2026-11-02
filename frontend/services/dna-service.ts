import { supabase } from '@/lib/supabase';

export interface DNAScores {
  energy: number;
  depth: number;
  frequency: number;
  rhythm: number;
  focus: number;
}

export interface DNAProfile {
  scores: DNAScores;
  genreDistribution: GenreShare[];
  hasHistory: boolean;
  listeningSeconds: number;
  trackCount: number;
}

export interface DNARecommendationPreferences {
  energyOffset: number;
  tempoOffset: number;
  vocalPreference: number;
}

export interface GenreShare {
  genre: string;
  value: number;
}

interface ListeningRecord {
  listened_seconds?: unknown;
  completed?: unknown;
  tracks?: unknown;
}

interface TrackRecord {
  genre?: unknown;
  track_features?: unknown;
}

interface TrackFeatures {
  [key: string]: unknown;
}

const DEFAULT_SCORES: DNAScores = {
  energy: 50,
  depth: 50,
  frequency: 50,
  rhythm: 50,
  focus: 50,
};

export const DEFAULT_DNA_PREFERENCES: DNARecommendationPreferences = {
  energyOffset: 0,
  tempoOffset: 0,
  vocalPreference: 50,
};

const GENRES = [
  { genre: 'Lo-fi', color: '#67E8F9' },
  { genre: 'Ambient', color: '#A78BFA' },
  { genre: 'Classical', color: '#F472B6' },
  { genre: 'Synthwave', color: '#FDBA74' },
  { genre: 'Acoustic', color: '#34D399' },
  { genre: 'Khác', color: '#64748B' },
] as const;

const LOOKBACK_DAYS = 30;
const PAGE_SIZE = 1000;
const BACKEND_URL = 'http://localhost:5000';

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function toPercent(value: unknown): number | null {
  const parsed = asNumber(value);
  if (parsed === null) return null;
  return clamp(parsed >= 0 && parsed <= 1 ? parsed * 100 : parsed);
}

function getFeatures(record: ListeningRecord): TrackFeatures | null {
  const track = getTrack(record);
  const features = track?.track_features as
    | TrackFeatures
    | TrackFeatures[]
    | null
    | undefined;
  return Array.isArray(features) ? features[0] ?? null : features ?? null;
}

function getTrack(record: ListeningRecord): TrackRecord | null {
  const tracks = record.tracks as TrackRecord | TrackRecord[] | null | undefined;
  return Array.isArray(tracks) ? tracks[0] ?? null : tracks ?? null;
}

function normalizeGenre(value: unknown): string {
  if (typeof value !== 'string') return 'Khác';
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (normalized.startsWith('lofi') || normalized.startsWith('lowfi')) {
    return 'Lo-fi';
  }
  if (normalized.includes('ambient')) return 'Ambient';
  if (normalized.includes('classical') || normalized === 'classic') {
    return 'Classical';
  }
  if (normalized.includes('synthwave')) return 'Synthwave';
  if (normalized.includes('acoustic')) return 'Acoustic';
  return 'Khác';
}

function calculateGenreDistribution(
  totals: Record<string, number>,
  listeningSeconds: number
): GenreShare[] {
  if (listeningSeconds <= 0) {
    return GENRES.slice(0, -1).map(({ genre }) => ({ genre, value: 0 }));
  }

  const shares = GENRES.map(({ genre }, index) => ({
    genre,
    index,
    exactValue: ((totals[genre] ?? 0) / listeningSeconds) * 100,
    value: Math.floor(((totals[genre] ?? 0) / listeningSeconds) * 100),
  }));
  let remainingPoints = 100 - shares.reduce(
    (total, share) => total + share.value,
    0
  );
  const remainderOrder = [...shares].sort(
    (first, second) =>
      second.exactValue -
        Math.floor(second.exactValue) -
        (first.exactValue - Math.floor(first.exactValue)) ||
      first.index - second.index
  );
  for (const share of remainderOrder) {
    if (remainingPoints <= 0) break;
    shares[share.index].value += 1;
    remainingPoints -= 1;
  }

  return shares
    .map(({ genre, value }) => ({
      genre,
      value,
    }))
    .filter(({ genre, value }) => genre !== 'Khác' || value > 0);
}

function isBinaural(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', '1', 'binaural'].includes(normalized)) return true;
    if (['false', 'no', '0', ''].includes(normalized)) return false;
  }
  return null;
}

function loudnessToPercent(value: unknown): number | null {
  const loudness = asNumber(value);
  if (loudness === null) return null;
  if (loudness >= 0 && loudness <= 1) return loudness * 100;
  return clamp(((loudness + 60) / 60) * 100);
}

function weightedAverage(
  values: { value: number; weight: number }[]
): number | null {
  const totalWeight = values.reduce((total, item) => total + item.weight, 0);
  if (totalWeight === 0) return null;
  const weightedTotal = values.reduce(
    (total, item) => total + item.value * item.weight,
    0
  );
  return Math.round(weightedTotal / totalWeight);
}

function getBinauralValue(features: TrackFeatures): boolean | null {
  for (const key of ['binaural', 'is_binaural', 'has_binaural']) {
    const value = isBinaural(features[key]);
    if (value !== null) return value;
  }
  return null;
}

export function createDefaultDNA(): DNAProfile {
  return {
    scores: { ...DEFAULT_SCORES },
    genreDistribution: calculateGenreDistribution({}, 0),
    hasHistory: false,
    listeningSeconds: 0,
    trackCount: 0,
  };
}

export function normalizeDNARecommendationPreferences(
  value: Partial<DNARecommendationPreferences> | null | undefined
): DNARecommendationPreferences {
  const energyOffset = asNumber(value?.energyOffset);
  const tempoOffset = asNumber(value?.tempoOffset);
  const vocalPreference = asNumber(value?.vocalPreference);
  return {
    energyOffset:
      energyOffset === null
        ? DEFAULT_DNA_PREFERENCES.energyOffset
        : Math.round(clamp(energyOffset, -20, 20)),
    tempoOffset:
      tempoOffset === null
        ? DEFAULT_DNA_PREFERENCES.tempoOffset
        : Math.round(clamp(tempoOffset, -20, 20)),
    vocalPreference:
      vocalPreference === null
        ? DEFAULT_DNA_PREFERENCES.vocalPreference
        : Math.round(clamp(vocalPreference)),
  };
}

export async function getDNARecommendationPreferences(
  userId: string
): Promise<DNARecommendationPreferences> {
  if (!userId || userId === 'guest') {
    return { ...DEFAULT_DNA_PREFERENCES };
  }

  const token =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('moodflow_token')
      : null;
  if (!token) return { ...DEFAULT_DNA_PREFERENCES };

  const response = await fetch(
    `${BACKEND_URL}/api/music-dna/${encodeURIComponent(userId)}/preferences`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const result = await response.json();
  if (!response.ok || !result.success || !result.data) {
    throw new Error(
      result.error || 'Không thể tải tùy chỉnh Music DNA.'
    );
  }

  return normalizeDNARecommendationPreferences(result.data);
}

export async function saveDNARecommendationPreferences(
  userId: string,
  preferences: DNARecommendationPreferences
): Promise<DNARecommendationPreferences> {
  if (!userId || userId === 'guest') {
    throw new Error('Đăng nhập để lưu tùy chỉnh Music DNA.');
  }

  const token =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('moodflow_token')
      : null;
  if (!token) {
    throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
  }

  const response = await fetch(
    `${BACKEND_URL}/api/music-dna/${encodeURIComponent(userId)}/preferences`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        normalizeDNARecommendationPreferences(preferences)
      ),
    }
  );
  const result = await response.json();
  if (!response.ok || !result.success || !result.data) {
    throw new Error(
      result.error || 'Không thể lưu tùy chỉnh Music DNA.'
    );
  }

  return normalizeDNARecommendationPreferences(result.data);
}

export function aggregateDNA(records: ListeningRecord[]): DNAProfile {
  const energy: { value: number; weight: number }[] = [];
  const depth: { value: number; weight: number }[] = [];
  const frequency: { value: number; weight: number }[] = [];
  const rhythm: { value: number; weight: number }[] = [];
  const focus: { value: number; weight: number }[] = [];
  let listeningSeconds = 0;
  let trackCount = 0;
  const genreTotals: Record<string, number> = {};

  for (const record of records) {
    const weight = asNumber(record.listened_seconds);
    const features = getFeatures(record);
    if (!weight || weight <= 0) continue;

    trackCount += 1;
    listeningSeconds += weight;
    const genre = normalizeGenre(getTrack(record)?.genre);
    genreTotals[genre] = (genreTotals[genre] ?? 0) + weight;
    if (!features) continue;

    const energyValue = toPercent(features.energy);
    if (energyValue !== null) energy.push({ value: energyValue, weight });

    const valence = toPercent(features.valence);
    const acousticness = toPercent(features.acousticness);
    if (valence !== null && acousticness !== null) {
      depth.push({
        value: (100 - valence) * 0.5 + acousticness * 0.5,
        weight,
      });
    }

    const binaural = getBinauralValue(features);
    const frequencyValue =
      binaural === null
        ? loudnessToPercent(features.loudness)
        : binaural
          ? 100
          : 0;
    if (frequencyValue !== null) {
      frequency.push({ value: frequencyValue, weight });
    }

    const bpm = asNumber(features.bpm);
    if (bpm !== null) {
      rhythm.push({ value: clamp((bpm - 40) / 1.6), weight });
    }

    const instrumentalness = toPercent(features.instrumentalness);
    if (instrumentalness !== null) {
      const completion = record.completed === true ? 1 : 0;
      focus.push({ value: instrumentalness * completion, weight });
    }
  }

  if (trackCount === 0) return createDefaultDNA();

  return {
    scores: {
      energy: weightedAverage(energy) ?? DEFAULT_SCORES.energy,
      depth: weightedAverage(depth) ?? DEFAULT_SCORES.depth,
      frequency: weightedAverage(frequency) ?? DEFAULT_SCORES.frequency,
      rhythm: weightedAverage(rhythm) ?? DEFAULT_SCORES.rhythm,
      focus: weightedAverage(focus) ?? DEFAULT_SCORES.focus,
    },
    genreDistribution: calculateGenreDistribution(genreTotals, listeningSeconds),
    hasHistory: true,
    listeningSeconds,
    trackCount,
  };
}

export async function computeDNA(userId: string): Promise<DNAProfile> {
  if (!userId || userId === 'guest') return createDefaultDNA();

  const token =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('moodflow_token')
      : null;
  let records: ListeningRecord[];

  if (token) {
    const response = await fetch(
      `${BACKEND_URL}/api/music-dna/${encodeURIComponent(userId)}/listening-history`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const result = await response.json();
    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      throw new Error(
        result.error || 'Không thể tải lịch sử nghe nhạc từ máy chủ.'
      );
    }
    records = result.data as ListeningRecord[];
  } else {
    const since = new Date();
    since.setDate(since.getDate() - LOOKBACK_DAYS);
    records = [];

    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await supabase
        .from('listening_history')
        .select(
          'listened_seconds, completed, tracks!inner(genre, track_features(*))'
        )
        .eq('user_id', userId)
        .gte('played_at', since.toISOString())
        .gt('listened_seconds', 0)
        .order('played_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Không thể tải lịch sử nghe nhạc: ${error.message}`);
      }

      records.push(...((data ?? []) as ListeningRecord[]));
      if (!data || data.length < PAGE_SIZE) break;
    }
  }

  return aggregateDNA(records);
}
