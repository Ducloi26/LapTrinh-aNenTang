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
  listenerIdentity: ListenerIdentity | null;
}

export type ListenerType =
  | 'deep_thinker'
  | 'flow_seeker'
  | 'energy_chaser'
  | 'night_dreamer'
  | 'soul_healer'
  | 'creative_explorer';

export interface ListenerIdentity {
  type: ListenerType;
  emoji: string;
  name: string;
  description: string;
  artists: string[];
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
  played_at?: unknown;
  tracks?: unknown;
  journeys?: unknown;
}

interface TrackRecord {
  artists?: { name?: unknown } | { name?: unknown }[] | null;
  genre?: unknown;
  primary_mood_id?: unknown;
  track_features?: unknown;
}

interface JourneyRecord {
  activity?: unknown;
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

function getJourney(record: ListeningRecord): JourneyRecord | null {
  const journeys = record.journeys as
    | JourneyRecord
    | JourneyRecord[]
    | null
    | undefined;
  return Array.isArray(journeys)
    ? journeys[0] ?? null
    : journeys ?? null;
}

function getArtistName(track: TrackRecord | null): string | null {
  const artists = track?.artists;
  const artist = Array.isArray(artists) ? artists[0] : artists;
  return typeof artist?.name === 'string' && artist.name.trim()
    ? artist.name.trim()
    : null;
}

const LISTENER_TYPES: Omit<ListenerIdentity, 'artists'>[] = [
  {
    type: 'deep_thinker',
    emoji: '🧠',
    name: 'Deep Thinker',
    description:
      'Bạn thường chọn âm nhạc giúp duy trì sự tập trung và suy nghĩ sâu. Những giai điệu có năng lượng vừa phải có thể đồng hành tốt với nhịp làm việc của bạn.',
  },
  {
    type: 'flow_seeker',
    emoji: '🌊',
    name: 'Flow Seeker',
    description:
      'Bạn thường nghe nhạc có nhịp điệu ổn định trong những phiên làm việc sâu. Âm nhạc dường như là một phần quen thuộc giúp bạn giữ mạch tập trung.',
  },
  {
    type: 'energy_chaser',
    emoji: '⚡',
    name: 'Energy Chaser',
    description:
      'Bạn thiên về những bản nhạc giàu năng lượng với nhịp nhanh. Những lựa chọn này thường tạo nên một không khí sôi nổi trong lúc nghe.',
  },
  {
    type: 'night_dreamer',
    emoji: '🌙',
    name: 'Night Dreamer',
    description:
      'Phần lớn thời gian nghe nhạc của bạn diễn ra vào buổi tối muộn. Âm nhạc có thể là khoảng riêng giúp bạn thư giãn sau một ngày dài.',
  },
  {
    type: 'soul_healer',
    emoji: '💗',
    name: 'Soul Healer',
    description:
      'Bạn dành nhiều thời gian cho những sắc thái âm nhạc trầm lắng và giàu cảm xúc. Những giai điệu này có thể đem lại không gian để bạn lắng nghe cảm xúc của mình.',
  },
  {
    type: 'creative_explorer',
    emoji: '🎨',
    name: 'Creative Explorer',
    description:
      'Bạn khám phá nhiều trạng thái âm nhạc khác nhau thay vì gắn với một sắc thái duy nhất. Sự đa dạng trong lựa chọn là nét nổi bật của hồ sơ nghe nhạc này.',
  },
];

const MOOD_ALIASES: Record<string, string> = {
  anxious: 'heartbreak_healing',
  calm: 'calm_unwind',
  focus: 'deep_focus',
  energetic: 'energy_boost',
  dreamy: 'night_serenade',
  romantic: 'creative_spark',
  happy: 'euphoric_bliss',
  sad: 'melancholy_chill',
};

function normalizeMoodId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const moodId = value.trim().toLowerCase();
  const normalized = MOOD_ALIASES[moodId] ?? moodId;
  return [
    'deep_focus',
    'calm_unwind',
    'energy_boost',
    'heartbreak_healing',
    'creative_spark',
    'melancholy_chill',
    'euphoric_bliss',
    'night_serenade',
  ].includes(normalized)
    ? normalized
    : null;
}

export function classifyListener(
  dna: DNAScores,
  history: ListeningRecord[]
): ListenerIdentity | null {
  const totalSeconds = history.reduce(
    (total, record) => total + Math.max(0, asNumber(record.listened_seconds) ?? 0),
    0
  );
  if (totalSeconds <= 0) return null;

  let deepWorkSeconds = 0;
  let lateNightSeconds = 0;
  let emotionalMoodSeconds = 0;
  let bpmSeconds = 0;
  let bpmWeight = 0;
  const moodIds = new Set<string>();
  const artistSeconds = new Map<string, number>();

  for (const record of history) {
    const seconds = Math.max(0, asNumber(record.listened_seconds) ?? 0);
    if (seconds === 0) continue;

    if (getJourney(record)?.activity === 'deep_work') {
      deepWorkSeconds += seconds;
    }

    if (typeof record.played_at === 'string') {
      const playedAt = new Date(record.played_at);
      if (!Number.isNaN(playedAt.getTime()) && playedAt.getHours() >= 21) {
        lateNightSeconds += seconds;
      }
    }

    const track = getTrack(record);
    const moodId = normalizeMoodId(track?.primary_mood_id);
    if (moodId) {
      moodIds.add(moodId);
      if (
        moodId === 'heartbreak_healing' ||
        moodId === 'melancholy_chill'
      ) {
        emotionalMoodSeconds += seconds;
      }
    }

    const bpm = asNumber(getFeatures(record)?.bpm);
    if (bpm !== null) {
      bpmSeconds += bpm * seconds;
      bpmWeight += seconds;
    }

    const artist = getArtistName(track);
    if (artist) {
      artistSeconds.set(artist, (artistSeconds.get(artist) ?? 0) + seconds);
    }
  }

  const averageBpm = bpmWeight > 0 ? bpmSeconds / bpmWeight : null;
  const deepWorkShare = deepWorkSeconds / totalSeconds;
  const lateNightShare = lateNightSeconds / totalSeconds;
  const emotionalMoodShare = emotionalMoodSeconds / totalSeconds;

  let selectedType: ListenerType | null = null;
  if (dna.focus > 70 && dna.energy < 40) {
    selectedType = 'deep_thinker';
  } else if (dna.rhythm >= 40 && dna.rhythm <= 65 && deepWorkShare > 0.5) {
    selectedType = 'flow_seeker';
  } else if (dna.energy > 70 && averageBpm !== null && averageBpm > 120) {
    selectedType = 'energy_chaser';
  } else if (lateNightShare > 0.5) {
    selectedType = 'night_dreamer';
  } else if (emotionalMoodShare > 0.4) {
    selectedType = 'soul_healer';
  } else if (moodIds.size >= 6) {
    selectedType = 'creative_explorer';
  }

  if (!selectedType) return null;

  const identity = LISTENER_TYPES.find(({ type }) => type === selectedType);
  if (!identity) return null;

  const artists = [...artistSeconds.entries()]
    .sort((first, second) => second[1] - first[1])
    .slice(0, 3)
    .map(([artist]) => artist);

  return { ...identity, artists };
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
    listenerIdentity: null,
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

export async function saveListenerType(
  userId: string,
  listenerType: ListenerType | null
): Promise<void> {
  if (!userId || userId === 'guest') {
    throw new Error('Đăng nhập để lưu hồ sơ định danh âm nhạc.');
  }

  const token =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('moodflow_token')
      : null;
  if (!token) {
    throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
  }

  const response = await fetch(
    `${BACKEND_URL}/api/music-dna/${encodeURIComponent(userId)}/listener-type`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ listenerType }),
    }
  );
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Không thể lưu hồ sơ định danh âm nhạc.');
  }
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

  const scores = {
    energy: weightedAverage(energy) ?? DEFAULT_SCORES.energy,
    depth: weightedAverage(depth) ?? DEFAULT_SCORES.depth,
    frequency: weightedAverage(frequency) ?? DEFAULT_SCORES.frequency,
    rhythm: weightedAverage(rhythm) ?? DEFAULT_SCORES.rhythm,
    focus: weightedAverage(focus) ?? DEFAULT_SCORES.focus,
  };
  return {
    scores,
    genreDistribution: calculateGenreDistribution(genreTotals, listeningSeconds),
    hasHistory: true,
    listeningSeconds,
    trackCount,
    listenerIdentity: classifyListener(scores, records),
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
          'listened_seconds, completed, played_at, tracks!inner(genre, primary_mood_id, track_features(*), artists(name)), journeys(activity)'
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
