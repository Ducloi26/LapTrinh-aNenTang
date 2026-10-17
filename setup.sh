#!/bin/bash
set -e
cd -- "$(dirname -- "$0")"

echo "=========================================================="
echo "🚀 BẮT ĐẦU CÀI ĐẶT DỰ ÁN MOODFLOW (TỰ ĐỘNG)"
echo "=========================================================="

echo ""
echo "📦 Đang cài thư viện frontend, backend và kiểm thử database..."
npm run install:all

echo ""
echo "⚙️ Kiểm tra cấu hình môi trường (.env)..."
if [ ! -f backend/.env ] && [ -f .env ]; then
    cp .env backend/.env
fi

if [ ! -f frontend/.env ]; then
    if [ -f .env ]; then
        cp .env frontend/.env
    else
        cp frontend/.env.example frontend/.env
        echo "Điền URL và public API key của Supabase vào frontend/.env trước khi chạy."
    fi
fi

echo ""
echo "=========================================================="
echo "🎉 CÀI ĐẶT THÀNH CÔNG TOÀN BỘ DỰ ÁN MOODFLOW!"
echo "=========================================================="
echo ""
echo "💡 ĐỂ CHẠY DỰ ÁN:"
echo "   - Terminal 1 (Backend):  cd backend && npm run dev"
echo "   - Terminal 2 (Frontend): cd frontend && npm run web"
echo ""
