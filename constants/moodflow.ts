export const COLORS = {
  bg: '#080B14',
  surface: '#0F1424',
  surface2: '#151C33',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  text: '#F1F3F8',
  muted: '#8890A8',
  faint: '#5C6382',
  danger: '#FB7185',
  ok: '#67E8F9',
};

export type GradientColors = readonly [string, string, ...string[]];

export interface Mood {
  id: string;
  emoji: string;
  label: string;
  colors: GradientColors;
  line: string;
}

export const MOODS: Mood[] = [
  { id: 'anxious', emoji: '😰', label: 'Căng thẳng', colors: ['#6366F1', '#EC4899'], line: 'Tìm lại nhịp thở tĩnh tại của chính bạn.' },
  { id: 'calm', emoji: '😌', label: 'Bình tĩnh', colors: ['#60A5FA', '#8B5CF6', '#67E8F9'], line: 'Biến sự tĩnh lặng thành nơi bạn thuộc về.' },
  { id: 'focus', emoji: '🧠', label: 'Tập trung', colors: ['#0F172A', '#22D3EE'], line: 'Đưa tâm trí bạn vào một luồng duy nhất.' },
  { id: 'energetic', emoji: '🔥', label: 'Năng lượng', colors: ['#FB923C', '#EF4444', '#EC4899'], line: 'Bắt nhịp với năng lượng của chính bạn.' },
  { id: 'dreamy', emoji: '🌙', label: 'Mơ màng', colors: ['#312E81', '#7C3AED', '#C4B5FD'], line: 'Nơi giai điệu tìm đến đúng lúc bạn cần.' },
  { id: 'romantic', emoji: '❤️', label: 'Lãng mạn', colors: ['#F472B6', '#EF4444', '#A855F7'], line: 'Mỗi cảm xúc đều xứng đáng có một giai điệu.' },
  { id: 'happy', emoji: '😊', label: 'Vui vẻ', colors: ['#FCD34D', '#FB923C', '#F472B6'], line: 'Mỗi ngày vui đều xứng đáng một giai điệu.' },
  { id: 'sad', emoji: '😔', label: 'Buồn', colors: ['#1E3A8A', '#6D28D9'], line: 'Âm nhạc ở lại cùng bạn, ngay cả những ngày buồn.' },
];

export const moodById = (id: string): Mood => MOODS.find((m) => m.id === id) || MOODS[1];

export interface Activity {
  id: string;
  label: string;
  icon: string;
}

export const ACTIVITIES: Activity[] = [
  { id: 'coding', label: 'Lập trình', icon: 'code' },
  { id: 'study', label: 'Học tập', icon: 'book' },
  { id: 'running', label: 'Chạy bộ', icon: 'footprints' },
  { id: 'driving', label: 'Lái xe', icon: 'car' },
  { id: 'relax', label: 'Thư giãn', icon: 'coffee' },
  { id: 'work', label: 'Làm việc', icon: 'briefcase' },
  { id: 'gaming', label: 'Chơi game', icon: 'gamepad' },
  { id: 'walking', label: 'Đi bộ', icon: 'footprints' },
];

export interface DurationOption {
  id: number;
  label: string;
}

export const DURATIONS: DurationOption[] = [
  { id: 15, label: '15 phút' },
  { id: 30, label: '30 phút' },
  { id: 60, label: '1 giờ' },
  { id: 120, label: '2 giờ' },
  { id: 180, label: '3 giờ' },
];

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Trang chủ', icon: 'home' },
  { id: 'discover', label: 'Khám phá', icon: 'compass' },
  { id: 'journey', label: 'Tạo hành trình', icon: 'sparkles' },
  { id: 'mymusic', label: 'Nhạc của tôi', icon: 'music' },
  { id: 'dna', label: 'Music DNA', icon: 'dna' },
  { id: 'community', label: 'Cộng đồng', icon: 'users' },
  { id: 'stats', label: 'Thống kê', icon: 'barchart' },
  { id: 'settings', label: 'Cài đặt & Đăng xuất', icon: 'settings' },
];

export interface Track {
  title: string;
  artist: string;
  genre: string;
  energy: number;
  duration: string;
  cover: string;
  mood?: string;
  reason?: string;
}

export const TRACK_POOL: Record<string, Track[]> = {
  calmdown: [
    { title: 'Slow Tide', artist: 'Nima Sky', genre: 'Ambient', energy: 22, duration: '3:41', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80' },
    { title: 'Paper Rain', artist: 'Wren Hale', genre: 'Lo-fi', energy: 28, duration: '2:58', cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80' },
    { title: 'Quiet Room', artist: 'Odalys', genre: 'Soft', energy: 18, duration: '4:02', cover: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=200&auto=format&fit=crop&q=80' },
  ],
  focus: [
    { title: 'Glasswork', artist: 'Halden', genre: 'Lo-fi', energy: 45, duration: '3:15', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80' },
    { title: 'Low Light Desk', artist: 'Maren Cole', genre: 'Instrumental', energy: 40, duration: '3:52', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80' },
    { title: 'Static Bloom', artist: 'Iyo', genre: 'Indie', energy: 48, duration: '3:20', cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&auto=format&fit=crop&q=80' },
  ],
  deepfocus: [
    { title: 'Signal / Noise', artist: 'Verse Atlas', genre: 'Minimal', energy: 52, duration: '5:10', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80' },
    { title: 'Concrete Drift', artist: 'Halden', genre: 'Ambient', energy: 50, duration: '4:44', cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&auto=format&fit=crop&q=80' },
    { title: 'Interior', artist: 'Maren Cole', genre: 'Instrumental', energy: 55, duration: '4:08', cover: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  ],
  cooldown: [
    { title: 'Evening Keys', artist: 'Odalys', genre: 'Piano', energy: 15, duration: '3:30', cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80' },
    { title: 'Afterglow', artist: 'Nima Sky', genre: 'Chill', energy: 20, duration: '3:05', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80' },
    { title: 'Soft Landing', artist: 'Wren Hale', genre: 'Soft', energy: 17, duration: '2:49', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80' },
  ],
  energize: [
    { title: 'Ignition', artist: 'Ruta Voss', genre: 'Pop', energy: 78, duration: '3:02', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80' },
    { title: 'Red Line', artist: 'Kavi Okon', genre: 'R&B', energy: 72, duration: '2:54', cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&auto=format&fit=crop&q=80' },
    { title: 'Momentum', artist: 'Ruta Voss', genre: 'Indie', energy: 80, duration: '3:18', cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&auto=format&fit=crop&q=80' },
  ],
  romantic: [
    { title: 'Slow Dial', artist: 'Odalys', genre: 'R&B', energy: 35, duration: '3:44', cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80' },
    { title: 'Warm Static', artist: 'Kavi Okon', genre: 'Soul', energy: 32, duration: '3:29', cover: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=200&auto=format&fit=crop&q=80' },
  ],
};

export interface StageTemplate {
  key: string;
  emoji: string;
  title: string;
  pool: string;
  share: number;
}

export const STAGE_TEMPLATES: Record<string, StageTemplate[]> = {
  toFocus: [
    { key: 'calmdown', emoji: '🌿', title: 'Calm Down', pool: 'calmdown', share: 0.16 },
    { key: 'focus', emoji: '🎧', title: 'Focus', pool: 'focus', share: 0.42 },
    { key: 'deepfocus', emoji: '🧠', title: 'Deep Focus', pool: 'deepfocus', share: 0.30 },
    { key: 'cooldown', emoji: '✨', title: 'Cool Down', pool: 'cooldown', share: 0.12 },
  ],
  toCalm: [
    { key: 'release', emoji: '🌫️', title: 'Release', pool: 'calmdown', share: 0.35 },
    { key: 'settle', emoji: '🌊', title: 'Settle', pool: 'cooldown', share: 0.40 },
    { key: 'rest', emoji: '🌙', title: 'Rest', pool: 'cooldown', share: 0.25 },
  ],
  toEnergetic: [
    { key: 'wake', emoji: '🌤️', title: 'Wake Up', pool: 'calmdown', share: 0.2 },
    { key: 'build', emoji: '⚡', title: 'Build Up', pool: 'focus', share: 0.3 },
    { key: 'peak', emoji: '🔥', title: 'Peak', pool: 'energize', share: 0.5 },
  ],
  toRomantic: [
    { key: 'unwind', emoji: '🌆', title: 'Unwind', pool: 'calmdown', share: 0.3 },
    { key: 'close', emoji: '❤️', title: 'Close', pool: 'romantic', share: 0.7 },
  ],
};

export const GENRES = [
  'V-Pop', 'K-Pop', 'US-UK', 'EDM', 'Lofi', 'R&B',
  'Rap/Hip-hop', 'Ballad', 'Rock', 'Jazz', 'Classical', 'Indie',
];
