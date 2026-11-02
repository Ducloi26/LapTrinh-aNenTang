#!/bin/bash

echo "=========================================================="
echo "🚀 BẮT ĐẦU CÀI ĐẶT DỰ ÁN MOODFLOW (TỰ ĐỘNG)"
echo "=========================================================="

echo ""
echo "📦 [1/3] Đang cài đặt thư viện cho Thư mục Gốc..."
npm install

echo ""
echo "📦 [2/3] Đang cài đặt thư viện cho Backend (Node.js Express)..."
cd backend && npm install && cd ..

echo ""
echo "📦 [3/3] Đang cài đặt thư viện cho Frontend (Expo React Native)..."
cd frontend && npm install && cd ..

echo ""
echo "⚙️ Kiểm tra cấu hình môi trường (.env)..."
if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
    echo "✅ Đã tự động tạo file .env từ .env.example"
fi

if [ ! -f backend/.env ] && [ -f .env ]; then
    cp .env backend/.env
fi

if [ ! -f frontend/.env ] && [ -f .env ]; then
    cp .env frontend/.env
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
