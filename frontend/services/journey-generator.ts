import {
  Mood,
  Track,
  JOURNEY_4_STAGES,
  TRACK_POOL,
  ACTIVITIES,
  ActivityId,
  DurationMinutes,
  StageKey,
} from '@/constants/moodflow';

export interface Stage {
  key: StageKey;
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
  const totalSeconds = Math.round(total * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h && `${h} giờ`, m && `${m} phút`, s && `${s} giây`]
    .filter(Boolean).join(' ') || '0 phút';
}

/**
 * Thuật toán sinh lý do đề xuất cá nhân hóa dựa trên tâm trạng & hoạt động
 */
export function reasonFor(
  track: Track,
  activityId: ActivityId,
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
  activity: ActivityId;
  duration: DurationMinutes;
}): Journey {
  const { moodFrom, moodTo, activity, duration } = params;
  const totalSeconds = duration * 60;
  let t = 0;

  const stages: Stage[] = JOURNEY_4_STAGES.map((tpl, i) => {
    const stageSeconds = i === JOURNEY_4_STAGES.length - 1
      ? totalSeconds - t
      : Math.round(totalSeconds * tpl.share);
    const stageMin = stageSeconds / 60;
    const start = t;
    t += stageSeconds;
    const pool = TRACK_POOL[tpl.pool] || TRACK_POOL.acknowledge;
    
    // Mỗi giai đoạn chọn từ 1 đến 2 bài hát phù hợp thời lượng
    const trackCount = Math.max(1, Math.min(pool.length, Math.round(stageMin / 10)));

    const tracks: Track[] = Array.from({ length: trackCount }, (_, idx) => {
      const base = pool[idx % pool.length];
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
      range: `${fmtMin(start / 60)} – ${fmtMin(t / 60)}`,
      startMin: start / 60,
      endMin: t / 60,
      tracks,
    };
  });

  const act = ACTIVITIES.find((a) => a.id === activity);

  return {
    stages,
    totalMin: t / 60,
    moodFrom,
    moodTo,
    activityLabel: act ? act.label : 'Tự do',
  };
}
