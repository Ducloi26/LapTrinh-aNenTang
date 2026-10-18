# File phát nhạc và lịch sử nghe trên Deip

Danh sách đối chiếu các thay đổi trước đây trong `4aba6c5` (6.2 – phát nhạc), `da5e160` (cấu hình môi trường), `a7727a3` (6.5 – lịch sử nghe) và lần sắp xếp sau khi merge `main`. Đã đối chiếu đủ 35 đường dẫn gốc của hai hạng mục 6.2/6.5 với vị trí hiện tại. Một số file đã được `main` chuyển sẵn; lần này xử lý phần còn sót và ghép lại các thay đổi.

## Vị trí sau khi sắp xếp

| Nhóm | Vị trí | Nội dung |
| --- | --- | --- |
| Ứng dụng | `frontend/` | Toàn bộ Expo, giao diện, player, lịch sử nghe và tài nguyên âm thanh |
| Express | `backend/` | Backend từ main; giữ cấu trúc hiện tại |
| Database | `supabase/migration`s/` | Migration và RPC PostgreSQL |
| Test ứng dụng | `frontend/tests/player/` | Player, nguồn nhạc, lịch sử, khách và tích hợp hành trình |
| Test database | `supabase/tests/` | Test SQL bằng PGlite, không ghi lên Supabase thật |
| Tài liệu | `docs/testing/` | Hướng dẫn thử trên Web, điện thoại và database |

Các thư mục nguồn cũ ở gốc (`app`, `components`, `constants`, `contexts`, `services`, `assets/audio`, `scripts`) đã được gom về các vị trí trên. File có thay đổi từ cả hai nhánh được ghép nội dung vào bản trong `frontend/`, gồm thuật toán hành trình bốn giai đoạn và các trang mới từ main.

## Toàn bộ file của phần 6.2 và 6.5

Các đường dẫn bên dưới tính từ thư mục gốc dự án.

### Luồng ứng dụng và giao diện

- `frontend/app/_layout.tsx`: đặt PlayerProvider dùng chung.
- `frontend/app/index.tsx`: tải thư viện thật, điều khiển hàng đợi, truyền mood/stage/journey vào lịch sử và dừng trước khi đăng xuất.
- `frontend/contexts/PlayerContext.tsx`: trạng thái, queue, chuyển bài, phiên người nghe, retry lịch sử và chế độ khách.
- `frontend/components/moodflow/player/BottomPlayer.tsx`: điều khiển MP3, volume, preset, trạng thái lưu và nút khách.
- `frontend/components/moodflow/player/NowPlayingModal.tsx`: giao diện đang phát, tua và thời lượng thật.
- `frontend/components/moodflow/shared/Icon.tsx`: icon tương thích trên mobile.
- `frontend/components/moodflow/my-music/MyMusicPage.tsx`: thư viện bài thật, đồng thời giữ các tab và hành trình đã lưu từ main.
- `frontend/components/moodflow/journey/JourneyPage.tsx`: giao diện hành trình và sửa JSX.
- `frontend/constants/moodflow.ts`: kiểu Track có ID/nguồn âm thanh; giữ tám tâm trạng và bốn giai đoạn từ main.

### Dịch vụ

- `frontend/services/player-service.ts`: load, play, pause, seek, volume, progress/end, phối MP3 với Binaural và chốt lượt nghe.
- `frontend/services/audio-engine.types.ts`: giao diện chung của bộ phát.
- `frontend/services/audio-engine.ts`: expo-audio trên Android/iOS, phát nền và điều khiển màn hình khóa.
- `frontend/services/audio-engine.web.ts`: HTMLAudio trên Web.
- `frontend/services/track-source.ts`: chọn URL/Storage và định danh bài hát.
- `frontend/services/track-catalog.ts`: đọc bảng tracks và phân kho nhạc cho hành trình.
- `frontend/services/journey-generator.ts`: tạo hành trình bằng kho bài thật, giữ ID mood để ghi lịch sử.
- `frontend/services/listening-history-tracker.ts`: đo thời gian thực nghe, bỏ lượt dưới năm giây.
- `frontend/services/listening-history-service.ts`: gửi RPC và hàng đợi thử lại theo người dùng.
- `frontend/services/guest-session.ts`: tạo/dùng lại phiên Supabase ẩn danh khi người nghe chọn.
- `frontend/lib/supabase-config.ts`: kiểm tra URL/key và phát hiện cấu hình mẫu.

### Cấu hình, tài nguyên và test

- `frontend/app.json`: plugin expo-audio và cấu hình phát nền.
- `frontend/assets/audio/binaural-deep-work.wav`
- `frontend/assets/audio/binaural-relax.wav`
- `frontend/assets/audio/binaural-sleep.wav`
- `frontend/scripts/generate-binaural.cjs`: tạo lại ba vòng lặp WAV.
- `frontend/tests/player/player-service.test.cjs`
- `frontend/tests/player/listening-history.test.cjs`
- `frontend/tests/player/guest-session.test.cjs`
- `frontend/tests/player/test-support.cjs`
- `supabase/migrations/202610170001_record_listening_history.sql`: hàm RPC `record_listening_history`, ghi vào bảng `listening_history` và tăng `tracks.play_count` trong cùng giao dịch.
- `supabase/tests/listening-history-db.test.cjs`
- `docs/testing/PLAYER_TESTING.md`
- `docs/testing/LISTENING_HISTORY_TESTING.md`
- `.gitignore`: giữ môi trường/dependency ngoài Git; cho phép theo dõi nguồn, migration và test.
- `frontend/.env.example`: mẫu cấu hình công khai. File `.env.example` cũ ở gốc đã được bỏ trong `da5e160`; mẫu mới nằm cạnh ứng dụng.

## File bổ sung hoặc chỉnh để ghép hai nhánh lần này

- `frontend/services/journey-library.ts`: chuẩn hóa hành trình đã lưu/cộng đồng và khôi phục URL bài thật theo thư viện; giữ luồng tự lưu hành trình của main.
- `frontend/hooks/use-listener-profile.ts`: giữ hồ sơ đăng nhập backend từ main, đồng thời theo dõi phiên Supabase/khách của player.
- `frontend/services/audio-presets.ts`: nhận thêm ID tâm trạng/hoạt động mới từ main.
- `frontend/tests/player/journey-integration.test.cjs`: kiểm tra bốn giai đoạn dùng bài thật, khôi phục hành trình đã lưu và chọn preset theo ID mới.
- `frontend/components/moodflow/journey/MusicCard.tsx`: bỏ dấu xung đột merge, giữ kiểu hiển thị từ main.
- `frontend/components/moodflow/statistics/SessionFeedbackModal.tsx`: đọc đúng định dạng Journey của player.
- `frontend/components/moodflow/home/HomePage.tsx`, `frontend/components/moodflow/statistics/StatisticsPage.tsx`: sửa dấu nháy JSX để lint chạy được.
- `SCHEMA.md`: bỏ dấu xung đột, giữ mô tả bảng đánh giá phiên từ main.
- `frontend/package.json`, `frontend/package-lock.json`: dependency Expo/audio, ghim expo-asset theo SDK 54 và script test ở đúng ứng dụng.
- `supabase/package.json`, `supabase/package-lock.json`: dependency PGlite riêng cho test database.
- `package.json`, `package-lock.json`: gốc chỉ điều hướng lệnh sang từng phần, tránh giữ thêm một bộ dependency Expo.
- `setup.bat`, `setup.sh`: cài đúng ba phần và tạo cấu hình frontend khi chưa có.
- `README.md`, `docs/PLAYER_HISTORY_FILES.md`: hướng dẫn cấu trúc và danh sách file này.

Ba file `api/.gitignore`, `api/authRoutes.js`, `api/server.js` đã ở trạng thái bị xóa trước lần sắp xếp này; đây không phải thay đổi mới của phần player/history. Backend hiện tại nằm trong `backend/`.

## Chạy và kiểm tra

Thực hiện ở thư mục gốc dự án:

```powershell
npm run install:all
npm run web -- --clear
```

Backend dùng cho các trang/API từ main: mở terminal khác chạy `npm run dev:backend`.

```powershell
npm test
npm run test:db
npm run typecheck
npm run lint
```

Chi tiết thao tác thử: [phát MP3](testing/PLAYER_TESTING.md), [lịch sử nghe và play_count](testing/LISTENING_HISTORY_TESTING.md).

Lưu ý: tài khoản Express/JWT từ main và phiên Supabase dùng để ghi lịch sử vẫn là hai cơ chế xác thực riêng. Để test RPC lịch sử, player cần phiên Supabase thường hoặc phiên khách ẩn danh. Lần sắp xếp này không thay đổi schema hay áp dụng migration lên database thật.

## Kết quả kiểm tra sau sắp xếp

- 33/33 test ứng dụng đạt, gồm bốn test tích hợp mới cho việc ghép với main.
- Tám tình huống SQL đạt trên PGlite; Node báo chín test khi tính cả test bao ngoài.
- TypeScript đạt; lint không có lỗi, còn 18 cảnh báo ở các thành phần hiện có.
- Expo export Web/Android/iOS thành công, kết quả tại `frontend/dist/reorg-check/` (được Git bỏ qua).
- Không còn dấu xung đột merge trong mã nguồn; `git diff --check` đạt.
- Chưa kiểm tra nghe MP3 hoặc khóa màn hình trực tiếp trên điện thoại sau lần sắp xếp này.

## Cập nhật 6.5 ngày 18/10/2026: chỉ dùng bảng hiện có

- SQL `supabase/migrations/202610170001_record_listening_history.sql` đã bỏ toàn bộ lệnh thêm cột. Không cần bảng mới hoặc cột mood/stage để ghi một lượt khi hết/chuyển bài, bỏ lượt dưới năm giây và tăng play_count.
- Hàm `record_listening_history` nhận cả cấu trúc có `journey_id` hoặc `jouney_id`, ghi mood/stage khi những cột đó đã có; không đổi tên hay thêm cột.
- Giữ unique index `(user_id, playback_id)` và cập nhật bộ đếm trong cùng giao dịch để thử gửi lại không tăng hai lần.
- SQL test cục bộ đạt 10 tình huống (11 khi tính test bao ngoài); 33 test ứng dụng đạt. Không sửa lại giao diện hoặc backend Express từ main trong lần này.
- Bổ sung ngoại lệ Git cho `supabase/tests/listening-history-db.test.cjs` và hai file package của bộ test, vì quy tắc `/supabase` đã khiến những file này chưa được lưu trong commit trước.
- Cần chạy lại nội dung SQL đã cập nhật trong Supabase SQL Editor trước khi thử ứng dụng. Chưa thực thi lên database thật từ phiên làm việc này.
