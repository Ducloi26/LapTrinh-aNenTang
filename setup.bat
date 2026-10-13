@echo off
chcp 65001 > nul
echo ==========================================================
echo 🚀 BẮT ĐẦU CÀI ĐẶT DỰ ÁN MOODFLOW (TỰ ĐỘNG)
echo ==========================================================

echo.
echo 📦 [1/3] Đang cài đặt thư viện cho Thư mục Gốc...
call npm install

echo.
echo 📦 [2/3] Đang cài đặt thư viện cho Backend (Node.js Express)...
cd backend
call npm install
cd ..

echo.
echo 📦 [3/3] Đang cài đặt thư viện cho Frontend (Expo React Native)...
cd frontend
call npm install
cd ..

echo.
echo ⚙️ Kiểm tra cấu hình môi trường (.env)...
if not exist .env (
    if exist .env.example (
        copy .env.example .env > nul
        echo ✅ Đã tự động tạo file .env từ .env.example
    )
)
if not exist backend\.env (
    if exist .env copy .env backend\.env > nul
)
if not exist frontend\.env (
    if exist .env copy .env frontend\.env > nul
)

echo.
echo ==========================================================
echo 🎉 CÀI ĐẶT THÀNH CÔNG TOÀN BỘ DỰ ÁN MOODFLOW!
echo ==========================================================
echo.
echo 💡 ĐỂ CHẠY DỰ ÁN:
echo   - Terminal 1 (Backend):  cd backend ^&^& npm run dev
echo   - Terminal 2 (Frontend): cd frontend ^&^& npm run web
echo.
pause
