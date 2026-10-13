export type SynthPresetId = 'deep-work' | 'relax' | 'sleep';

export type BrainwaveBand = 'Delta' | 'Theta' | 'Alpha' | 'Beta' | 'Gamma';

export interface SynthPreset {
  id: SynthPresetId;
  label: string;
  description: string;
  brainwave: BrainwaveBand;
  deltaHz: number;
  baseFrequency: number;
  beatDifference: number;
  ambientChordProgression: readonly number[][];
}

export const SYNTH_PRESETS: Record<SynthPresetId, SynthPreset> = {
  'deep-work': {
    id: 'deep-work',
    label: 'Deep Work',
    description: 'Tập trung sâu',
    brainwave: 'Beta',
    deltaHz: 10,
    baseFrequency: 200,
    beatDifference: 10,
    ambientChordProgression: [
      [220, 277, 330],
      [196, 246, 293],
      [220, 262, 392],
      [174, 220, 261],
    ],
  },
  relax: {
    id: 'relax',
    label: 'Relax',
    description: 'Thư giãn',
    brainwave: 'Alpha',
    deltaHz: 6,
    baseFrequency: 200,
    beatDifference: 6,
    ambientChordProgression: [
      [196, 247, 294],
      [174, 220, 261],
      [220, 262, 330],
      [196, 246, 293],
    ],
  },
  sleep: {
    id: 'sleep',
    label: 'Sleep',
    description: 'Chuẩn bị nghỉ ngơi',
    brainwave: 'Delta',
    deltaHz: 4,
    baseFrequency: 200,
    beatDifference: 4,
    ambientChordProgression: [
      [174, 220, 261],
      [146, 196, 220],
      [131, 174, 220],
      [174, 220, 262],
    ],
  },
};

export function presetForMoodActivity(
  moodId: string,
  activityId: string,
): SynthPresetId {
  if (activityId === 'sleep' || activityId === 'rest') return 'sleep';
  if (
    activityId === 'relax' ||
    activityId === 'walking' ||
    ['calm', 'dreamy', 'sad'].includes(moodId)
  ) {
    return 'relax';
  }
  return 'deep-work';
}
