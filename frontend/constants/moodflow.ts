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
  targetEnergy: number; // 0..100
  targetValence: number; // 0..100
}

export const MOODS: Mood[] = [
  { id: 'deep_focus', emoji: '🧠', label: 'Tập trung sâu', colors: ['#0F172A', '#22D3EE'], line: 'Đưa tâm trí bạn vào một luồng suy nghĩ duy nhất.', targetEnergy: 45, targetValence: 50 },
  { id: 'calm_unwind', emoji: '😌', label: 'Thư giãn & Bình yên', colors: ['#60A5FA', '#8B5CF6', '#67E8F9'], line: 'Biến sự tĩnh lặng thành nơi bạn thuộc về.', targetEnergy: 20, targetValence: 60 },
  { id: 'energy_boost', emoji: '🔥', label: 'Bùng nổ năng lượng', colors: ['#FB923C', '#EF4444', '#EC4899'], line: 'Bắt nhịp với nguồn năng lượng tích cực của bạn.', targetEnergy: 90, targetValence: 80 },
  { id: 'heartbreak_healing', emoji: '💔', label: 'Chữa lành & Vỗ về', colors: ['#1E3A8A', '#6D28D9'], line: 'Âm nhạc ở lại cùng bạn, vỗ về từng tổn thương.', targetEnergy: 30, targetValence: 25 },
  { id: 'creative_spark', emoji: '✨', label: 'Khơi nguồn sáng tạo', colors: ['#FCD34D', '#A855F7', '#EC4899'], line: 'Mở khóa cảm hứng và ý tưởng mới trong bạn.', targetEnergy: 65, targetValence: 75 },
  { id: 'melancholy_chill', emoji: '🌧️', label: 'Lắng đọng & Trầm tư', colors: ['#334155', '#475569', '#6366F1'], line: 'Những khoảng lặng dịu êm cho một ngày mưa.', targetEnergy: 25, targetValence: 35 },
  { id: 'euphoric_bliss', emoji: '🌈', label: 'Hân hoan phấn chấn', colors: ['#F472B6', '#FCD34D', '#34D399'], line: 'Đón nhận niềm vui và nụ cười rạng rỡ.', targetEnergy: 85, targetValence: 95 },
  { id: 'night_serenade', emoji: '🌙', label: 'Giai điệu đêm khuya', colors: ['#312E81', '#7C3AED', '#C4B5FD'], line: 'Đưa giấc ngủ và màn đêm về với bình yên.', targetEnergy: 15, targetValence: 45 },
];

export const moodById = (id: string): Mood => {
  // Map tương thích ngược nếu còn id cũ
  const aliasMap: Record<string, string> = {
    anxious: 'heartbreak_healing',
    calm: 'calm_unwind',
    focus: 'deep_focus',
    energetic: 'energy_boost',
    dreamy: 'night_serenade',
    romantic: 'creative_spark',
    happy: 'euphoric_bliss',
    sad: 'melancholy_chill',
  };
  const targetId = aliasMap[id] || id;
  return MOODS.find((m) => m.id === targetId) || MOODS[0];
};

export interface Activity {
  id: string;
  label: string;
  icon: string;
}

export const ACTIVITIES: Activity[] = [
  { id: 'deep_work', label: 'Làm việc sâu', icon: 'laptop' },
  { id: 'meditation', label: 'Thiền định', icon: 'flower' },
  { id: 'workout', label: 'Tập luyện', icon: 'activity' },
  { id: 'sleep', label: 'Giấc ngủ', icon: 'moon' },
];

export interface DurationOption {
  id: number;
  label: string;
}

export const DURATIONS: DurationOption[] = [
  { id: 15, label: '15 phút' },
  { id: 30, label: '30 phút' },
  { id: 45, label: '45 phút' },
  { id: 60, label: '60 phút' },
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
  id?: string;
  title: string;
  artist: string;
  genre: string;
  energy: number;
  duration: string;
  cover: string;
  audioUrl?: string;
  bpm?: number;
  valence?: number;
  psychologicalEffect?: string;
  mood?: string;
  reason?: string;
}

export const TRACK_POOL: Record<string, Track[]> = {
  acknowledge: [
    { title: 'Chậm Lại Một Nhịp', artist: 'Vũ & Minh Đinh', genre: 'Indie Pop', energy: 28, bpm: 68, psychologicalEffect: 'Đồng điệu nỗi buồn, giải tỏa cortisol căng thẳng', duration: '3:45', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80' },
    { title: 'Mưa Đầu Mùa', artist: 'Thái Đinh', genre: 'Acoustic Ballad', energy: 32, bpm: 72, psychologicalEffect: 'Thấu cảm cảm xúc, kích hoạt sóng Alpha êm dịu', duration: '4:10', cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80' },
    { title: 'Tĩnh Lặng Giữa Đêm', artist: 'Hà Anh Tuấn', genre: 'Ballad', energy: 25, bpm: 65, psychologicalEffect: 'An định tinh thần, hạ nhịp tim về mức thư giãn', duration: '3:50', cover: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=300&auto=format&fit=crop&q=80' },
  ],
  transition: [
    { title: 'Dòng Chảy Bình Yên', artist: 'Lê Cát Trọng Lý', genre: 'Folk Chill', energy: 45, bpm: 84, psychologicalEffect: 'Chuyển hóa năng lượng, giảm tải ức chế tiền đình', duration: '3:30', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80' },
    { title: 'Gió Qua Rừng Thông', artist: 'Hoàng Dũng', genre: 'Acoustic', energy: 48, bpm: 88, psychologicalEffect: 'Kích thích lưu thông máu nhẹ nhàng, mở rộng chú ý', duration: '4:02', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80' },
    { title: 'Sương Mai', artist: 'Nguyên Hà', genre: 'Lo-fi Chill', energy: 42, bpm: 80, psychologicalEffect: 'Thả lỏng cơ bắp, cân bằng bán cầu não', duration: '3:22', cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&auto=format&fit=crop&q=80' },
  ],
  elevate: [
    { title: 'Bình Minh Rạng Rỡ', artist: 'Da LAB', genre: 'Indie RnB', energy: 70, bpm: 105, psychologicalEffect: 'Tăng tiết Dopamine, nâng cao động lực hành động', duration: '3:35', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80' },
    { title: 'Nắng Ban Mai', artist: 'Bùi Công Nam', genre: 'Pop Acoustic', energy: 72, bpm: 110, psychologicalEffect: 'Thắp sáng tâm trạng, đánh thức hưng phấn tự nhiên', duration: '3:28', cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80' },
    { title: 'Bước Chân Đầu Tiên', artist: 'Chillies', genre: 'Pop Rock', energy: 75, bpm: 115, psychologicalEffect: 'Củng cố sự tự tin, tạo nhịp điệu làm việc dồi dào', duration: '3:50', cover: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
  ],
  transcendence: [
    { title: 'Ánh Sáng Thuần Khiết', artist: 'Trịnh Công Sơn (Instrumental)', genre: 'Neo-Classical', energy: 50, bpm: 90, psychologicalEffect: 'Trạng thái Flow State, duy trì năng lượng bền vững đỉnh cao', duration: '4:15', cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80' },
    { title: 'Khát Vọng Bay Xa', artist: 'Sơn Tùng M-TP', genre: 'Electro Pop', energy: 88, bpm: 128, psychologicalEffect: 'Thăng hoa toàn diện, kích hoạt trạng thái hân hoan tuyệt đối', duration: '3:40', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80' },
    { title: 'Giấc Mơ Bình Yên', artist: 'Quốc Bảo', genre: 'Ambient Piano', energy: 30, bpm: 60, psychologicalEffect: 'Sóng Theta sâu, neo giữ sự bình an nội tại', duration: '4:30', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80' },
  ],
};

export interface StageTemplate {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
  pool: string;
  share: number;
}

/**
 * 4 Giai đoạn Hành trình Âm nhạc Chuẩn hóa Khoa học (Mục 4 Đề cương)
 * 1. Acknowledge (20%) -> 2. Transition (30%) -> 3. Elevate (30%) -> 4. Transcendence (20%)
 */
export const JOURNEY_4_STAGES: StageTemplate[] = [
  {
    key: 'acknowledge',
    emoji: '🌊',
    title: 'Khởi đầu & Thấu cảm',
    subtitle: 'Đồng điệu cùng trạng thái cảm xúc hiện tại của bạn',
    pool: 'acknowledge',
    share: 0.20,
  },
  {
    key: 'transition',
    emoji: '🍃',
    title: 'Chuyển tiếp',
    subtitle: 'Nhẹ nhàng chuyển hóa năng lượng và nhịp sinh học',
    pool: 'transition',
    share: 0.30,
  },
  {
    key: 'elevate',
    emoji: '✨',
    title: 'Nâng đỡ',
    subtitle: 'Đưa tâm trí tiến dần về trạng thái tối ưu',
    pool: 'elevate',
    share: 0.30,
  },
  {
    key: 'transcendence',
    emoji: '🌟',
    title: 'Thăng hoa & An định',
    subtitle: 'Đạt đỉnh thư thái hoặc tập trung bền vững',
    pool: 'transcendence',
    share: 0.20,
  },
];

// Giữ lại alias STAGE_TEMPLATES để bảo toàn tương thích ngược
export const STAGE_TEMPLATES: Record<string, StageTemplate[]> = {
  toFocus: JOURNEY_4_STAGES,
  toCalm: JOURNEY_4_STAGES,
  toEnergetic: JOURNEY_4_STAGES,
  toRomantic: JOURNEY_4_STAGES,
};

export const GENRES = [
  'V-Pop', 'K-Pop', 'US-UK', 'EDM', 'Lofi', 'R&B',
  'Rap/Hip-hop', 'Ballad', 'Rock', 'Jazz', 'Classical', 'Indie',
];
