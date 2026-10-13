const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
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

// 2. Khởi tạo Supabase client
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

const app = express();
const PORT = process.env.PORT || 5000;

// 3. Middlewares
app.use(cors());
app.use(express.json());

// Middleware ghi log đẹp mắt trên terminal cho mỗi request
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
// 4. CÁC API ENDPOINTS
// ==========================================

/**
 * [GET] /api/health
 * Kiểm tra trạng thái máy chủ và kết nối cơ sở dữ liệu Supabase
 */
app.get('/api/health', async (req, res) => {
  let dbStatus = 'Chưa kết nối';
  let dbDetails = null;

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
    message: 'Máy chủ Backend MoodFlow đang chạy ổn định!',
    timestamp: new Date().toISOString(),
    service: 'MoodFlow API Server',
    port: PORT,
    database: {
      provider: 'Supabase Cloud',
      url: supabaseUrl || 'Không tìm thấy URL',
      status: dbStatus,
    }
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
      console.error('❌ Lỗi lấy danh sách tâm trạng:', error.message);
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
      console.error('❌ Lỗi lấy danh sách hoạt động:', error.message);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * [GET] /api/tracks
 * Lấy danh sách bài hát và phân tích đặc trưng âm nhạc (BPM, Energy, Valence)
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
      console.error('❌ Lỗi lấy danh sách bài hát:', error.message);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * [POST] /api/journeys/generate
 * Thuật toán tạo hành trình âm nhạc 4 giai đoạn khoa học
 */
app.post('/api/journeys/generate', async (req, res) => {
  const { mood_id, activity_id, duration_minutes = 30 } = req.body;

  if (!mood_id || !activity_id) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng cung cấp đầy đủ mood_id và activity_id'
    });
  }

  // 4 giai đoạn chuẩn hóa khoa học
  const stages = [
    {
      order: 1,
      code: 'acknowledge',
      title: 'Khởi đầu & Thấu cảm',
      subtitle: 'Đồng điệu cùng trạng thái cảm xúc hiện tại của bạn',
      percentage: 20
    },
    {
      order: 2,
      code: 'transition',
      title: 'Chuyển tiếp',
      subtitle: 'Nhẹ nhàng chuyển hóa năng lượng và nhịp sinh học',
      percentage: 30
    },
    {
      order: 3,
      code: 'elevate',
      title: 'Nâng đỡ',
      subtitle: 'Đưa tâm trí tiến dần về trạng thái năng lượng tối ưu',
      percentage: 30
    },
    {
      order: 4,
      code: 'transcendence',
      title: 'Thăng hoa & An định',
      subtitle: 'Đạt đỉnh thư thái hoặc tập trung tuyệt đối bền vững',
      percentage: 20
    }
  ];

  res.json({
    success: true,
    message: 'Tạo hành trình 4 giai đoạn thành công!',
    journey: {
      mood_id,
      activity_id,
      duration_minutes,
      total_stages: 4,
      stages
    }
  });
});

// 5. Khởi động Server
app.listen(PORT, () => {
  console.log('\n==========================================================');
  console.log('🚀 MÁY CHỦ BACKEND MOODFLOW ĐÃ KHỞI CHẠY THÀNH CÔNG!');
  console.log('==========================================================');
  console.log(`📡 Địa chỉ cục bộ:     http://localhost:${PORT}`);
  console.log(`🩺 Kiểm tra trạng thái: http://localhost:${PORT}/api/health`);
  console.log(`🎭 Danh sách tâm trạng: http://localhost:${PORT}/api/moods`);
  console.log(`🏃 Danh sách hoạt động: http://localhost:${PORT}/api/activities`);
  console.log(`🎵 Danh sách bài hát:   http://localhost:${PORT}/api/tracks`);
  console.log(`🔗 Kết nối Supabase:   ${supabaseUrl ? 'ĐÃ SẴN SÀNG ✅' : 'CHƯA CÓ KEY ❌'}`);
  console.log('==========================================================');
  console.log('💡 Nhấn phím Ctrl + C để dừng máy chủ bất cứ lúc nào.\n');
});
