export type SynthPresetId = 'deep-work' | 'relax' | 'sleep' | 'meditation' | 'energy';

export type BrainwaveBand = 'Delta' | 'Theta' | 'Alpha' | 'Beta' | 'Gamma';

export interface SynthPreset {
  id: SynthPresetId;
  label: string;
  description: string;
  brainwave: BrainwaveBand;
  deltaHz: number;
  baseFrequency: number;
  beatDifference: number;
  ambientChordProgression: readonly (readonly number[])[];
  ambientMode: 'major' | 'minor';
}

const MAJOR_CHORDS = [
  [220, 277, 330],
  [262, 330, 392],
  [294, 370, 440],
  [247, 311, 370],
] as const;

const MINOR_CHORDS = [
  [220, 262, 330],
  [262, 311, 392],
  [294, 349, 440],
  [247, 294, 370],
] as const;

export const SYNTH_PRESETS: Record<SynthPresetId, SynthPreset> = {
  'deep-work': {
    id: 'deep-work',
    label: 'Deep Work',
    description: 'Tập trung sâu',
    brainwave: 'Beta',
    deltaHz: 20,
    baseFrequency: 400,
    beatDifference: 20,
    ambientChordProgression: MAJOR_CHORDS,
    ambientMode: 'major',
  },
  relax: {
    id: 'relax',
    label: 'Alpha',
    description: 'Thư giãn & sáng tạo',
    brainwave: 'Alpha',
    deltaHz: 10,
    baseFrequency: 300,
    beatDifference: 10,
    ambientChordProgression: MAJOR_CHORDS,
    ambientMode: 'major',
  },
  sleep: {
    id: 'sleep',
    label: 'Sleep',
    description: 'Chuẩn bị nghỉ ngơi',
    brainwave: 'Delta',
    deltaHz: 2,
    baseFrequency: 100,
    beatDifference: 2,
    ambientChordProgression: MINOR_CHORDS,
    ambientMode: 'minor',
  },
  meditation: {
    id: 'meditation',
    label: 'Meditation',
    description: 'Thiền định & giai điệu đêm',
    brainwave: 'Theta',
    deltaHz: 6,
    baseFrequency: 200,
    beatDifference: 6,
    ambientChordProgression: MINOR_CHORDS,
    ambientMode: 'minor',
  },
  energy: {
    id: 'energy',
    label: 'Energy',
    description: 'Năng lượng & tập luyện',
    brainwave: 'Gamma',
    deltaHz: 35,
    baseFrequency: 500,
    beatDifference: 35,
    ambientChordProgression: MAJOR_CHORDS,
    ambientMode: 'major',
  },
};

const THETA_MOODS = ['night_serenade'];
const ALPHA_MOODS = [
  'calm',
  'dreamy',
  'sad',
  'calm_unwind',
  'creative_spark',
  'heartbreak_healing',
  'melancholy_chill',
];

export function presetForMoodActivity(
  moodId: string,
  activityId: string,
): SynthPresetId {
  if (activityId === 'sleep' || activityId === 'rest') return 'sleep';
  if (activityId === 'workout' || moodId === 'energy_boost' || moodId === 'euphoric_bliss') {
    return 'energy';
  }
  if (activityId === 'meditation' || THETA_MOODS.includes(moodId)) {
    return 'meditation';
  }
  if (
    activityId === 'relax' ||
    activityId === 'walking' ||
    ALPHA_MOODS.includes(moodId)
  ) {
    return 'relax';
  }
  return 'deep-work';
}
