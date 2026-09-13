import {
  Mood,
  Track,
  STAGE_TEMPLATES,
  TRACK_POOL,
  ACTIVITIES,
  StageTemplate,
} from '@/constants/moodflow';

export interface Stage {
  key: string;
  emoji: string;
  title: string;
  range: string;
  startMin: number;
  endMin: number;
  tracks: Track[];
}

export interface Journey {
  stages: Stage[];
  totalMin: number;
}

export function pickTemplate(goalId: string): StageTemplate[] {
  if (goalId === 'focus') return STAGE_TEMPLATES.toFocus;
  if (goalId === 'calm' || goalId === 'sad') return STAGE_TEMPLATES.toCalm;
  if (goalId === 'energetic') return STAGE_TEMPLATES.toEnergetic;
  if (goalId === 'romantic') return STAGE_TEMPLATES.toRomantic;
  return STAGE_TEMPLATES.toFocus;
}

export function fmtMin(total: number): string {
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  if (h > 0) return `${h} giờ ${m > 0 ? m + ' phút' : ''}`.trim();
  return `${m} phút`;
}

export function reasonFor(track: Track, activity: string, moodFrom: Mood, moodTo: Mood): string {
  const act = ACTIVITIES.find((a) => a.id === activity);
  const options = [
    `Được đề xuất vì bạn thường nghe ${track.genre} và hiện tại muốn ${moodTo.label.toLowerCase()}.`,
    `Phù hợp với giai đoạn hiện tại của hành trình từ ${moodFrom.label.toLowerCase()}.`,
    act ? `Nhịp độ vừa phải, hợp với lúc bạn đang ${act.label.toLowerCase()}.` : `Nhịp độ phù hợp với trạng thái hiện tại.`,
  ];
  return options[(track.title.length + track.energy) % options.length];
}

export function generateJourney(params: {
  moodFrom: Mood;
  moodTo: Mood;
  activity: string;
  duration: number;
}): Journey {
  const { moodFrom, moodTo, activity, duration } = params;
  const template = pickTemplate(moodTo.id);
  let t = 0;

  const stages: Stage[] = template.map((tpl, i) => {
    const stageMin = Math.max(4, Math.round(duration * tpl.share));
    const start = t;
    t += stageMin;
    const pool = TRACK_POOL[tpl.pool] || TRACK_POOL.calmdown;
    const trackCount = Math.max(1, Math.round(stageMin / 20));

    const tracks: Track[] = Array.from({ length: Math.min(trackCount, pool.length) }, (_, idx) => {
      const base = pool[idx % pool.length];
      return {
        ...base,
        mood: i === 0 ? moodFrom.label : moodTo.label,
        reason: reasonFor(base, activity, moodFrom, moodTo),
      };
    });

    return {
      key: tpl.key,
      emoji: tpl.emoji,
      title: tpl.title,
      range: `${fmtMin(start)} – ${fmtMin(t)}`,
      startMin: start,
      endMin: t,
      tracks,
    };
  });

  return { stages, totalMin: t };
}
