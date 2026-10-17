@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ==========================================================
echo 🚀 BẮT ĐẦU CÀI ĐẶT DỰ ÁN MOODFLOW (TỰ ĐỘNG)
echo ==========================================================

echo.
echo 📦 Đang cài thư viện frontend, backend và kiểm thử database...
call npm run install:all
if errorlevel 1 (
    echo Cài đặt thất bại. Kiểm tra thông báo lỗi phía trên.
    pause
    exit /b 1
)

echo.
echo ⚙️ Kiểm tra cấu hình môi trường (.env)...
if not exist backend\.env (
    if exist .env copy .env backend\.env > nul
)
if not exist frontend\.env (
    if exist .env (
        copy .env frontend\.env > nul
    ) else (
        copy frontend\.env.example frontend\.env > nul
        echo Điền URL và public API key của Supabase vào frontend\.env trước khi chạy.
    )
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
