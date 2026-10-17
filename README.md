# 🎵 MoodFlow - Ứng dụng Trị liệu Âm nhạc Cá nhân hóa Đa nền tảng

> **Dự án Môn học:** Lập trình Đa nền tảng (LTDNT)  
> **Kiến trúc:** Client - Server - Database (Tách biệt 100% giữa Frontend và Backend)

---

## 📂 Cấu trúc Dự án

```text
LapTrinh-aNenTang/
├── backend/                       # 🟢 MÁY CHỦ BACKEND (Node.js Express)
│   ├── index.js                   # API Server (Auth Bcrypt + JWT, Moods, Activities, Tracks)
│   ├── package.json               # Thư viện Express, Cors, Bcryptjs, Jsonwebtoken, Nodemon
│   └── data/                      # Lưu trữ dữ liệu tài khoản cục bộ
│
├── frontend/                      # 🔵 ỨNG DỤNG FRONTEND (React Native / Expo)
│   ├── app/                       # Expo Router (Trang chủ, Đăng nhập, Đăng ký)
│   ├── components/                # Linh kiện UI (Thẻ bài hát BPM, Đường cong năng lượng, Player)
│   ├── constants/                 # 8 tâm trạng, 4 hoạt động, 4 giai đoạn khoa học
│   ├── services/                  # Player, lịch sử nghe, thuật toán hành trình và API
│   ├── contexts/                  # PlayerProvider dùng chung
│   ├── tests/player/              # Kiểm thử phát nhạc, lịch sử và chế độ khách
│   └── package.json               # Thư viện Expo, Reanimated, Lucide Icons
│
├── supabase/                      # 🗄️ CƠ SỞ DỮ LIỆU (PostgreSQL)
│   ├── seed_moods_activities.sql  # Dữ liệu mẫu 8 tâm trạng & 4 hoạt động
│   ├── migrations/               # Hàm ghi listening_history và tăng play_count
│   ├── tests/                    # Kiểm thử SQL trên PostgreSQL cục bộ
│   └── create_app_users.sql       # Bảng người dùng app_users
│
├── docs/                         # Hướng dẫn test và danh sách file player/history
│   ├── PLAYER_HISTORY_FILES.md
│   └── testing/
│
├── setup.bat                      # ⚡ File tự động cài đặt 1-Click cho Windows
├── setup.sh                       # ⚡ File tự động cài đặt cho macOS / Linux
├── package.json                   # Bộ điều hướng script tổng của dự án
└── README.md                      # Hướng dẫn chi tiết
```

---

## 🚀 Hướng dẫn Cài đặt sau khi Git Clone

Sau khi clone dự án về máy tính:

```bash
git clone https://github.com/Ducloi26/LapTrinh-aNenTang.git
cd LapTrinh-aNenTang
```

Bạn có thể chọn **1 trong 2 cách** sau để tự động tải toàn bộ thư viện:

### 🔹 Cách 1: Dùng file tự động (Khuyên dùng - Nhanh nhất)
- **Trên Windows:** Click đúp chuột vào file **`setup.bat`** (hoặc mở Terminal gõ `setup.bat`).
- **Trên macOS / Linux:** Mở Terminal và gõ:
  ```bash
  chmod +x setup.sh && ./setup.sh
  ```
*(Script cài dependency cho frontend, backend và kiểm thử database; tạo `frontend/.env` khi chưa có. Điền cấu hình Supabase của bạn trước khi chạy ứng dụng.)*

---

### 🔹 Cách 2: Dùng lệnh NPM tại thư mục gốc
Nếu muốn tự chạy bằng dòng lệnh, bạn chỉ cần gõ đúng 1 lệnh duy nhất tại thư mục gốc:

```bash
npm run install:all
```
*(Lệnh này cài packages cho frontend, backend và kiểm thử database. Thư mục gốc chỉ giữ script điều hướng.)*

---

## ⚙️ Cấu hình Biến môi trường (.env)

Tạo `frontend/.env` từ `frontend/.env.example`. Backend có thể dùng `backend/.env` hoặc `.env` tại gốc.

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_API_KEY
```
Giữ file `.env` ngoài Git. Chỉ dùng public/publishable key cho frontend.

---

## 💻 Hướng dẫn Khởi chạy Dự án

Để chạy đúng chuẩn mô hình Client - Server, bạn mở **2 tab Terminal** trong VS Code:

### 🟢 Terminal 1: Chạy Backend (Node.js Express)
```bash
cd backend
npm run dev
```
- Máy chủ Backend sẽ khởi chạy tại: **`http://localhost:5000`**
- Hỗ trợ **Nodemon** tự động reload code và in log chi tiết cho từng request.
- Xác thực tài khoản độc lập bằng **Bcrypt password hashing** và **JWT Token**.

---

### 🔵 Terminal 2: Chạy Frontend (Expo / React Native)
```bash
cd frontend
npm run web
```
- Giao diện ứng dụng MoodFlow sẽ tự động mở trên trình duyệt tại: **`http://localhost:8081`**
- Hỗ trợ đầy đủ: Đăng ký / Đăng nhập, Trợ lý AI, Khám phá 8 tâm trạng, 4 hoạt động và Hành trình âm nhạc 4 giai đoạn chuẩn khoa học.

---

## 🛑 Cách tắt ứng dụng
- Nhấn tổ hợp phím **`Ctrl + C`** ở từng tab Terminal khi muốn dừng máy chủ.

## Phát nhạc, lịch sử nghe và chế độ khách

- [Danh sách file và cách sắp xếp sau merge](docs/PLAYER_HISTORY_FILES.md)
- [Test phát MP3 Web/Mobile](docs/testing/PLAYER_TESTING.md)
- [Test lịch sử nghe, play_count và khách](docs/testing/LISTENING_HISTORY_TESTING.md)

Chạy từ thư mục gốc: `npm run web`, `npm test`, `npm run typecheck`, `npm run lint`. Test PostgreSQL: `npm run test:db`. `npm run install:all` cài dependency cho frontend, backend và test database.
