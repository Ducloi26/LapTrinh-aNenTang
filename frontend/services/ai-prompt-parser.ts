import {
  ActivityId, DURATIONS, DurationMinutes, MoodId,
  isActivityId, isDurationMinutes, isMoodId,
} from '@/constants/moodflow';

export interface AIParsedResult {
  mood: MoodId;
  activity: ActivityId;
  goal: MoodId;
  duration: DurationMinutes;
}

function limitPrompt(text: string): string {
  const limited = text.slice(0, 1000);
  return /[\uD800-\uDBFF]$/.test(limited) ? limited.slice(0, -1) : limited;
}

function parseDuration(text: string): DurationMinutes {
  const tokens = Array.from(text.matchAll(/(?:^|[^\p{L}\p{N}_.+\-])([+\-]?\d[\d.,]*)\s*(tiếng|giờ|phút)(?!\p{L})/gu));
  const token = tokens.find((match) => match[2] !== 'phút') ?? tokens[0];
  if (!token || !/^\+?\d{1,4}(?:[.,]\d{1,2})?$/.test(token[1])) return 60;

  const minutes = Number(token[1].replace(',', '.')) * (token[2] === 'phút' ? 1 : 60);
  if (!Number.isFinite(minutes) || minutes <= 0) return 60;

  return DURATIONS.reduce((nearest, option) =>
    Math.abs(option.id - minutes) <= Math.abs(nearest - minutes) ? option.id : nearest,
  DURATIONS[0].id);
}

export function parsePrompt(text: unknown): AIParsedResult {
  const t = typeof text === 'string'
    ? limitPrompt(limitPrompt(text).normalize('NFC')).trim().toLowerCase().replace(/\s+/g, ' ')
    : '';
  const matches = (...words: string[]) => words.some((word) => t.includes(word));

  let mood: MoodId = 'heartbreak_healing';
  if (matches('mệt', 'căng thẳng', 'áp lực', 'chill', 'nghỉ')) mood = 'calm_unwind';
  else if (matches('chia tay', 'tan vỡ')) mood = 'heartbreak_healing';
  else if (matches('buồn')) mood = 'melancholy_chill';
  else if (matches('vui')) mood = 'euphoric_bliss';
  else if (matches('hào hứng', 'phấn khích')) mood = 'energy_boost';
  else if (matches('sáng tạo')) mood = 'creative_spark';
  else if (matches('đêm khuya')) mood = 'night_serenade';
  else if (matches('tập trung')) mood = 'deep_focus';

  let activity: ActivityId = 'deep_work';
  if (matches('thiền', 'meditation')) activity = 'meditation';
  else if (matches('ngủ', 'giấc ngủ')) activity = 'sleep';
  else if (matches('chạy', 'gym', 'thể dục', 'tập luyện')) activity = 'workout';

  let goal: MoodId = 'deep_focus';
  if (matches('tập trung')) goal = 'deep_focus';
  else if (matches('bình tĩnh', 'thư giãn', 'ngủ')) goal = 'calm_unwind';
  else if (matches('năng lượng')) goal = 'energy_boost';
  else if (matches('lãng mạn', 'yêu')) goal = 'night_serenade';

  const duration = parseDuration(t);
  if (!isMoodId(mood) || !isMoodId(goal) || !isActivityId(activity) || !isDurationMinutes(duration)) {
    throw new Error('Lựa chọn không hợp lệ.');
  }
  return { mood, activity, goal, duration };
}
