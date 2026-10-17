import { JOURNEY_4_STAGES, moodById, Track } from '../constants/moodflow';
import { Journey } from './journey-generator';

/** Normalize saved/community journeys without replacing their stages with a new journey. */
export function normalizeSavedJourney(raw: any, library: Track[]): Journey {
  const from = moodById(raw.moodFromId || raw.moodFrom?.id || raw.mood_from || 'deep_focus');
  const to = moodById(raw.moodToId || raw.moodTo?.id || raw.mood_to || 'calm_unwind');
  let end = 0;
  const total = raw.totalMin || raw.duration_minutes || 30;
  return {
    id: raw.id,
    moodFromId: from.id, moodToId: to.id, moodFrom: from, moodTo: to,
    totalMin: total, activityLabel: raw.activityLabel || raw.activity || 'Tự do',
    stages: (raw.stages || []).map((stage: any, index: number) => {
      const template = JOURNEY_4_STAGES[index];
      const startMin = stage.startMin ?? end;
      end = stage.endMin ?? startMin + Math.round(total * (template?.share || 0.25));
      return {
        ...stage, key: stage.key || template?.key || `stage-${index}`,
        subtitle: stage.subtitle || template?.subtitle || '',
        startMin, endMin: end,
        tracks: (stage.tracks || []).filter(Boolean).map((track: Track) => {
          const source = library.find((candidate) => track.id ? candidate.id === track.id : candidate.title === track.title && candidate.artist === track.artist);
          return source ? { ...track, ...source } : track;
        }),
      };
    }),
  };
}

/** Keep main's automatic save to the Express backend separate from audio playback. */
export async function saveGeneratedJourney(journey: Journey, userId: string, userName: string) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('moodflow_token') : null;
  const response = await fetch('http://localhost:5000/api/journeys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({
      title: `${journey.moodFrom.emoji} ${journey.moodFrom.label} ➔ ${journey.moodTo.emoji} ${journey.moodTo.label}`,
      moodFrom: journey.moodFrom, moodTo: journey.moodTo,
      activity: journey.activityLabel, duration: journey.totalMin, stages: journey.stages,
      userId, userName,
    }),
  });
  if (!response.ok) throw new Error('Không lưu được hành trình trên máy chủ.');
}
