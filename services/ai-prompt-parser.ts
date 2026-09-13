export interface AIParsedResult {
  mood: string;
  activity: string;
  goal: string;
  duration: number;
}

export function parsePrompt(text: string): AIParsedResult {
  const t = text.toLowerCase();

  let mood = 'anxious';
  if (t.includes('mệt') || t.includes('căng thẳng') || t.includes('áp lực')) mood = 'anxious';
  else if (t.includes('buồn') || t.includes('chán')) mood = 'sad';
  else if (t.includes('vui') || t.includes('hào hứng')) mood = 'happy';
  else if (t.includes('chill') || t.includes('nghỉ')) mood = 'calm';

  let activity = 'study';
  if (t.includes('code') || t.includes('lập trình') || t.includes('dev')) activity = 'coding';
  else if (t.includes('học') || t.includes('bài') || t.includes('thi')) activity = 'study';
  else if (t.includes('chạy') || t.includes('gym') || t.includes('thể dục')) activity = 'running';
  else if (t.includes('xe') || t.includes('đường')) activity = 'driving';
  else if (t.includes('game') || t.includes('chơi')) activity = 'gaming';
  else if (t.includes('làm việc') || t.includes('task') || t.includes('deadline')) activity = 'work';

  let goal = 'focus';
  if (t.includes('tập trung') || t.includes('năng suất') || t.includes('chăm')) goal = 'focus';
  else if (t.includes('bình tĩnh') || t.includes('thư giãn') || t.includes('ngủ') || t.includes('yên tĩnh')) goal = 'calm';
  else if (t.includes('năng lượng') || t.includes('bùng nổ') || t.includes('tỉnh')) goal = 'energetic';
  else if (t.includes('lãng mạn') || t.includes('yêu')) goal = 'romantic';

  let duration = 60;
  const hourMatch = t.match(/(\d+)\s*(tiếng|giờ)/);
  const minMatch = t.match(/(\d+)\s*phút/);

  if (hourMatch) duration = parseInt(hourMatch[1], 10) * 60;
  else if (minMatch) duration = parseInt(minMatch[1], 10);

  return { mood, activity, goal, duration };
}
