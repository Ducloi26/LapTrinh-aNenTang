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
│   ├── services/                  # Thuật toán hành trình 4 giai đoạn, API Service
│   └── package.json               # Thư viện Expo, Reanimated, Lucide Icons
│
├── supabase/                      # 🗄️ CƠ SỞ DỮ LIỆU (PostgreSQL)
│   ├── seed_moods_activities.sql  # Dữ liệu mẫu 8 tâm trạng & 4 hoạt động
│   └── create_app_users.sql       # Bảng người dùng app_users
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
*(Script sẽ tự động chạy `npm install` cho thư mục gốc, backend và frontend, đồng thời tự tạo file cấu hình `.env`).*

---

### 🔹 Cách 2: Dùng lệnh NPM tại thư mục gốc
Nếu muốn tự chạy bằng dòng lệnh, bạn chỉ cần gõ đúng 1 lệnh duy nhất tại thư mục gốc:

```bash
npm run install:all
```
*(Lệnh này sẽ tự động cài toàn bộ packages cho cả root, backend và frontend).*

---

## ⚙️ Cấu hình Biến môi trường (.env)

Tạo file `.env` ở thư mục gốc (hoặc copy từ `.env.example`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://oocldjiknduntqrpglua.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ByDOJJZoAQchyTosCmfG-A_W8P3tN7Q
```
*(Nếu đã chạy `setup.bat`, file `.env` sẽ được tự động tạo sẵn cho bạn).*

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
