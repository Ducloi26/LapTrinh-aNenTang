import {
  Mood,
  Track,
  JOURNEY_4_STAGES,
  TRACK_POOL,
  ACTIVITIES,
} from '@/constants/moodflow';
import type { DNARecommendationPreferences } from '@/services/dna-service';

export interface Stage {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
  range: string;
  startMin: number;
  endMin: number;
  tracks: Track[];
}

export interface Journey {
  stages: Stage[];
  totalMin: number;
  moodFrom: Mood;
  moodTo: Mood;
  activityLabel: string;
}

export function fmtMin(total: number): string {
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  if (h > 0) return `${h} giờ ${m > 0 ? m + ' phút' : ''}`.trim();
  return `${m} phút`;
}

/**
 * Thuật toán sinh lý do đề xuất cá nhân hóa dựa trên tâm trạng & hoạt động
 */
export function reasonFor(
  track: Track,
  activityId: string,
  moodFrom: Mood,
  moodTo: Mood,
  stageIndex: number
): string {
  const act = ACTIVITIES.find((a) => a.id === activityId);
  const actText = act ? act.label.toLowerCase() : 'hoạt động';

  switch (stageIndex) {
    case 0:
      return `Đồng điệu với tâm trạng ban đầu (${moodFrom.label.toLowerCase()}), giúp xoa dịu và lắng đọng cảm xúc.`;
    case 1:
      return `Nhịp điệu chuyển tiếp êm dịu, chuẩn bị năng lượng phù hợp cho lúc bạn đang ${actText}.`;
    case 2:
      return `Kích hoạt nhịp sinh học tích cực, nâng dần trạng thái tiến về ${moodTo.label.toLowerCase()}.`;
    case 3:
      return `Neo giữ trạng thái tối ưu đỉnh cao, giúp duy trì sự bình an và tập trung sâu.`;
    default:
      return `Được đề xuất khoa học để hỗ trợ tâm trí bạn đạt hiệu quả cao nhất.`;
  }
}

/**
 * Thuật toán tạo hành trình âm nhạc khoa học 4 giai đoạn chuẩn mực
 * 1. Khởi đầu & Thấu cảm (Acknowledge - 20%)
 * 2. Chuyển tiếp (Transition - 30%)
 * 3. Nâng đỡ (Elevate - 30%)
 * 4. Thăng hoa & An định (Transcendence - 20%)
 */
export function generateJourney(params: {
  moodFrom: Mood;
  moodTo: Mood;
  activity: string;
  duration: number;
  preferences?: DNARecommendationPreferences;
}): Journey {
  const { moodFrom, moodTo, activity, duration, preferences } = params;
  const hasCustomizedPreferences =
    preferences !== undefined &&
    (preferences.energyOffset !== 0 ||
      preferences.tempoOffset !== 0 ||
      preferences.vocalPreference !== 50);
  let t = 0;

  const stages: Stage[] = JOURNEY_4_STAGES.map((tpl, i) => {
    const stageMin = Math.max(3, Math.round(duration * tpl.share));
    const start = t;
    t += stageMin;
    const pool = TRACK_POOL[tpl.pool] || TRACK_POOL.acknowledge;
    
    // Mỗi giai đoạn chọn từ 1 đến 2 bài hát phù hợp thời lượng
    const trackCount = Math.max(1, Math.min(pool.length, Math.round(stageMin / 10)));

    const stageProgress = i / Math.max(JOURNEY_4_STAGES.length - 1, 1);
    const targetEnergy = Math.min(100, Math.max(0,
      moodFrom.targetEnergy +
      (moodTo.targetEnergy - moodFrom.targetEnergy) * stageProgress +
      (preferences?.energyOffset ?? 0)
    ));
    const targetTempo = Math.min(
      160,
      Math.max(40, 60 + targetEnergy * 0.7 + (preferences?.tempoOffset ?? 0))
    );
    const rankedPool = hasCustomizedPreferences && preferences
      ? pool
          .map((track) => ({
            track,
            score: preferenceScore(track, targetEnergy, targetTempo, preferences),
          }))
          .sort((first, second) => second.score - first.score)
          .map(({ track }) => track)
      : pool;

    const tracks: Track[] = Array.from({ length: trackCount }, (_, idx) => {
      const base = rankedPool[idx % rankedPool.length];
      return {
        ...base,
        mood: i === 0 ? moodFrom.label : moodTo.label,
        reason: base.psychologicalEffect 
          ? `[Tác dụng: ${base.psychologicalEffect}] - ${reasonFor(base, activity, moodFrom, moodTo, i)}`
          : reasonFor(base, activity, moodFrom, moodTo, i),
      };
    });

    return {
      key: tpl.key,
      emoji: tpl.emoji,
      title: tpl.title,
      subtitle: tpl.subtitle,
      range: `${fmtMin(start)} – ${fmtMin(t)}`,
      startMin: start,
      endMin: t,
      tracks,
    };
  });

  const act = ACTIVITIES.find((a) => a.id === activity);

  return {
    stages,
    totalMin: t,
    moodFrom,
    moodTo,
    activityLabel: act ? act.label : 'Tự do',
  };
}

function preferenceScore(
  track: Track,
  targetEnergy: number,
  targetTempo: number,
  preferences: DNARecommendationPreferences
): number {
  const energyMatch = 1 - Math.min(1, Math.abs(track.energy - targetEnergy) / 100);
  const tempoMatch =
    track.bpm === undefined
      ? 0.5
      : 1 - Math.min(1, Math.abs(track.bpm - targetTempo) / 120);
  const vocalMatch =
    track.vocal === undefined
      ? 0.5
      : 1 -
        Math.abs((track.vocal ? 100 : 0) - preferences.vocalPreference) / 100;

  return energyMatch * 0.3 + tempoMatch * 0.25 + vocalMatch * 0.45;
}
