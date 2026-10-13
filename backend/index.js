const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// 1. Tải cấu hình từ file .env (kiểm tra thư mục hiện tại hoặc thư mục cha)
const localEnv = path.resolve(__dirname, '.env');
const rootEnv = path.resolve(__dirname, '../.env');
const envPath = fs.existsSync(localEnv) ? localEnv : rootEnv;
let supabaseUrl = '';
let supabaseAnonKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('EXPO_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = trimmed.split('=')[1].trim();
    }
    if (trimmed.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = trimmed.split('=')[1].trim();
    }
  });
}

// 2. Khởi tạo Supabase client (dùng để lưu trữ CSDL)
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'moodflow_jwt_secret_token_key_2026';

// 3. Middlewares
app.use(cors());
app.use(express.json());

// Ghi log terminal đẹp mắt cho mỗi lượt gọi
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '❌' : '✅';
    console.log(`${statusColor} [${new Date().toLocaleTimeString('vi-VN')}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ==========================================
// 4. QUẢN LÝ TÀI KHOẢN ĐỘC LẬP (BCRYPT + CSDL)
// ==========================================

// Kho lưu trữ dự phòng nếu bảng CSDL chưa tạo
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const usersFile = path.resolve(dataDir, 'users.json');
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]', 'utf8');
const journeysFile = path.resolve(dataDir, 'journeys.json');
if (!fs.existsSync(journeysFile)) fs.writeFileSync(journeysFile, '[]', 'utf8');
const likedTracksFile = path.resolve(dataDir, 'liked_tracks.json');
if (!fs.existsSync(likedTracksFile)) fs.writeFileSync(likedTracksFile, '[]', 'utf8');

function getLocalUsers() {
  try {
    return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveLocalUsers(users) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {}
}

function getLocalJourneys() {
  try {
    return JSON.parse(fs.readFileSync(journeysFile, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveLocalJourneys(journeys) {
  try {
    fs.writeFileSync(journeysFile, JSON.stringify(journeys, null, 2), 'utf8');
  } catch (e) {}
}

function getLocalLikedTracks() {
  try {
    return JSON.parse(fs.readFileSync(likedTracksFile, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveLocalLikedTracks(tracks) {
  try {
    fs.writeFileSync(likedTracksFile, JSON.stringify(tracks, null, 2), 'utf8');
  } catch (e) {}
}

async function findUserByEmail(email) {
  const normEmail = email.toLowerCase().trim();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', normEmail)
        .maybeSingle();
      if (!error && data) return data;
    } catch (e) {}
  }
  const locals = getLocalUsers();
  return locals.find(u => u.email.toLowerCase() === normEmail) || null;
}

async function createUser({ email, passwordHash, displayName }) {
  const normEmail = email.toLowerCase().trim();
  const newUser = {
    id: crypto.randomUUID(),
    email: normEmail,
    password_hash: passwordHash,
    display_name: displayName || 'Người nghe',
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .insert({
          id: newUser.id,
          email: newUser.email,
          password_hash: newUser.password_hash,
          display_name: newUser.display_name,
        })
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {}
  }

  // Lưu file dự phòng
  const locals = getLocalUsers();
  locals.push(newUser);
  saveLocalUsers(locals);
  return newUser;
}

// ==========================================
// 5. CÁC API ENDPOINTS
// ==========================================

/**
 * [GET] /api/health
 * Kiểm tra trạng thái máy chủ
 */
app.get('/api/health', async (req, res) => {
  let dbStatus = 'Chưa kết nối';

  if (supabase) {
    try {
      const { data, error } = await supabase.from('moods').select('id').limit(1);
      if (error) {
        dbStatus = `Lỗi truy vấn: ${error.message}`;
      } else {
        dbStatus = 'Hoạt động ổn định (Connected)';
      }
    } catch (e) {
      dbStatus = `Lỗi ngoại lệ: ${e.message}`;
    }
  }

  res.json({
    success: true,
    message: 'Máy chủ Backend MoodFlow đang chạy ổn định (Bcrypt & JWT Active)!',
    timestamp: new Date().toISOString(),
    service: 'MoodFlow API Server',
    port: PORT,
    authMethod: 'Bcrypt Password Hashing + JWT Token (Independent)',
    database: {
      provider: 'Supabase Cloud PostgreSQL',
      url: supabaseUrl || 'Không tìm thấy URL',
      status: dbStatus,
    }
  });
});

/**
 * [POST] /api/auth/register
 * Backend tự mã hóa mật khẩu bằng BCRYPT và tự cấp JWT TOKEN
 */
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng cung cấp đầy đủ email và mật khẩu!'
    });
  }

  try {
    // 1. Kiểm tra tài khoản đã tồn tại hay chưa
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Email này đã được đăng ký tài khoản. Vui lòng chuyển sang Đăng nhập.'
      });
    }

    // 2. Backend tự mã hóa mật khẩu bằng BCRYPT
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Lưu tài khoản vào CSDL (bảng app_users)
    const user = await createUser({
      email,
      passwordHash,
      displayName: name || 'Người nghe'
    });

    // 4. Backend tự tạo mã JWT Token (hạn dùng 7 ngày)
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.display_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('\n==========================================================');
    console.log('👤 [BACKEND AUTH] ĐĂNG KÝ TÀI KHOẢN MỚI THÀNH CÔNG!');
    console.log(`📧 Email:        ${user.email}`);
    console.log(`🏷️ Tên:          ${user.display_name}`);
    console.log(`🔒 Mật khẩu băm: ${passwordHash.substring(0, 22)}... (Bcrypt)`);
    console.log(`🎟️ JWT Token:    ${token.substring(0, 25)}... (7 ngày)`);
    console.log('==========================================================\n');

    res.json({
      success: true,
      message: 'Đăng ký tài khoản thành công qua máy chủ Backend!',
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      }
    });
  } catch (err) {
    console.error('❌ [LỖI ĐĂNG KÝ BACKEND]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * [POST] /api/auth/login
 * Backend tự so khớp mật khẩu BCRYPT và cấp JWT TOKEN
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng cung cấp email và mật khẩu!'
    });
  }

  try {
    // 1. Tìm người dùng theo email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại email.'
      });
    }

    // 2. So khớp mật khẩu với mã băm Bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu không chính xác. Vui lòng thử lại!'
      });
    }

    // 3. Backend tự cấp JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.display_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`\n🔑 [BACKEND AUTH] ĐĂNG NHẬP THÀNH CÔNG: ${user.email} (Tên: ${user.display_name})\n`);

    res.json({
      success: true,
      message: 'Đăng nhập thành công qua máy chủ Backend!',
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * [GET] /api/auth/me
 * Lấy thông tin tài khoản đăng nhập hiện tại qua JWT Token
 */
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Chưa cung cấp Token đăng nhập.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      success: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        displayName: decoded.name,
      }
    });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
});

/**
 * [GET] /api/profiles
 * Lấy danh sách hồ sơ người dùng đã đăng ký
 */
app.get('/api/profiles', async (req, res) => {
  let list = [];
  if (supabase) {
    try {
      const { data } = await supabase.from('app_users').select('id, email, display_name, created_at');
      if (data && data.length > 0) list = data;
    } catch (e) {}
  }
  if (list.length === 0) {
    list = getLocalUsers().map(u => ({
      id: u.id,
      email: u.email,
      display_name: u.display_name,
      created_at: u.created_at
    }));
  }
  res.json({ success: true, count: list.length, data: list });
});

/**
 * [POST] /api/journeys
 * Lưu hành trình âm nhạc 4 giai đoạn vào CSDL
 */
app.post('/api/journeys', async (req, res) => {
  const { title, moodFrom, moodTo, activity, duration, stages, userId } = req.body;

  if (!stages || !Array.isArray(stages)) {
    return res.status(400).json({ success: false, error: 'Dữ liệu hành trình không hợp lệ.' });
  }

  const newJourney = {
    id: crypto.randomUUID(),
    title: title || `${moodFrom?.label || 'Tâm trạng'} ➔ ${moodTo?.label || 'Mục tiêu'}`,
    user_id: userId || 'guest',
    mood_from: moodFrom?.id || 'deep_focus',
    mood_to: moodTo?.id || 'calm_unwind',
    activity: activity || 'deep_work',
    duration_minutes: duration || 30,
    total_stages: stages.length,
    stages: stages,
    created_at: new Date().toISOString(),
  };

  // 1. Lưu vào CSDL Supabase nếu có bảng journeys
  if (supabase) {
    try {
      await supabase.from('journeys').insert({
        id: newJourney.id,
        title: newJourney.title,
        duration_minutes: newJourney.duration_minutes,
      });
    } catch (e) {}
  }

  // 2. Lưu vào kho dữ liệu máy chủ
  const allJourneys = getLocalJourneys();
  allJourneys.unshift(newJourney);
  saveLocalJourneys(allJourneys);

  console.log('\n==========================================================');
  console.log('💾 [BACKEND CSDL] ĐÃ LƯU HÀNH TRÌNH 4 GIAI ĐOẠN VÀO CSDL!');
  console.log(`🎵 Tiêu đề:    ${newJourney.title}`);
  console.log(`⏱️ Thời lượng: ${newJourney.duration_minutes} phút`);
  console.log(`🎼 Cấu trúc:   4 giai đoạn khoa học (${stages.reduce((acc, s) => acc + (s.tracks?.length || 0), 0)} bài hát)`);
  console.log('==========================================================\n');

  res.json({
    success: true,
    message: 'Đã lưu hành trình âm nhạc thành công vào CSDL!',
    journey: newJourney,
  });
});

/**
 * [GET] /api/journeys/my
 * Lấy danh sách toàn bộ hành trình người dùng đã lưu
 */
app.get('/api/journeys/my', async (req, res) => {
  const journeys = getLocalJourneys();
  res.json({
    success: true,
    count: journeys.length,
    data: journeys,
  });
});

/**
 * [DELETE] /api/journeys/:id
 * Xóa một hành trình khỏi danh sách đã lưu
 */
app.delete('/api/journeys/:id', async (req, res) => {
  const { id } = req.params;
  const journeys = getLocalJourneys();
  const filtered = journeys.filter(j => j.id !== id);
  saveLocalJourneys(filtered);

  console.log(`🗑️ [BACKEND CSDL] Đã xóa hành trình ID: ${id}`);
  res.json({ success: true, message: 'Đã xóa hành trình thành công.' });
});

/**
 * [POST] /api/tracks/like
 * Thả tim / Bỏ thích bài hát
 */
app.post('/api/tracks/like', (req, res) => {
  const { track } = req.body;
  if (!track || !track.id) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin bài hát.' });
  }

  const likedTracks = getLocalLikedTracks();
  const existingIndex = likedTracks.findIndex(t => t.id === track.id || (t.title === track.title && t.artist === track.artist));

  let isLiked = false;
  if (existingIndex >= 0) {
    // Đã thích -> Bỏ thích
    likedTracks.splice(existingIndex, 1);
    isLiked = false;
    console.log(`🤍 [BỎ THÍCH BÀI HÁT] ${track.title} - ${track.artist}`);
  } else {
    // Thích bài hát
    likedTracks.unshift({
      ...track,
      liked_at: new Date().toISOString(),
    });
    isLiked = true;
    console.log(`❤️ [THÍCH BÀI HÁT] ${track.title} - ${track.artist} (${track.bpm ? track.bpm + ' BPM' : ''})`);
  }

  saveLocalLikedTracks(likedTracks);
  res.json({
    success: true,
    liked: isLiked,
    message: isLiked ? 'Đã thêm bài hát vào danh sách yêu thích!' : 'Đã bỏ thích bài hát.',
    count: likedTracks.length,
  });
});

/**
 * [GET] /api/tracks/liked
 * Lấy danh sách các bài hát đã thích
 */
app.get('/api/tracks/liked', (req, res) => {
  const likedTracks = getLocalLikedTracks();
  res.json({
    success: true,
    count: likedTracks.length,
    data: likedTracks,
  });
});

/**
 * [GET] /api/moods
 * Lấy danh sách 8 tâm trạng chuẩn hóa
 */
app.get('/api/moods', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Chưa cấu hình Supabase Client.' });
  }

  try {
    const { data, error } = await supabase
      .from('moods')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * [GET] /api/activities
 * Lấy danh sách 4 hoạt động chuẩn hóa
 */
app.get('/api/activities', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Chưa cấu hình Supabase Client.' });
  }

  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * [GET] /api/tracks
 * Lấy danh sách bài hát và đặc trưng âm nhạc
 */
app.get('/api/tracks', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Chưa cấu hình Supabase Client.' });
  }

  try {
    const { data, error } = await supabase
      .from('tracks')
      .select(`
        id,
        title,
        artist,
        album_cover_url,
        audio_url,
        duration_seconds,
        is_active,
        track_features (
          bpm,
          energy,
          valence,
          psychological_effect
        )
      `)
      .eq('is_active', true)
      .limit(50);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Khởi động Server
app.listen(PORT, () => {
  console.log('\n==========================================================');
  console.log('🚀 MÁY CHỦ BACKEND MOODFLOW ĐÃ KHỞI CHẠY THÀNH CÔNG!');
  console.log('==========================================================');
  console.log(`📡 Địa chỉ cục bộ:     http://localhost:${PORT}`);
  console.log(`🩺 Kiểm tra trạng thái: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Cơ chế xác thực:   BCRYPT HASHING + JWT TOKEN (ĐỘC LẬP) ✅`);
  console.log(`🎭 Danh sách tâm trạng: http://localhost:${PORT}/api/moods`);
  console.log(`🏃 Danh sách hoạt động: http://localhost:${PORT}/api/activities`);
  console.log(`🎵 Danh sách bài hát:   http://localhost:${PORT}/api/tracks`);
  console.log(`👥 Danh sách tài khoản: http://localhost:${PORT}/api/profiles`);
  console.log('==========================================================');
  console.log('💡 Nhấn phím Ctrl + C để dừng máy chủ bất cứ lúc nào.\n');
});
