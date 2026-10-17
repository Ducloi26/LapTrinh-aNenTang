# 6.5 – Ghi lịch sử nghe (nhánh Deip)

## Áp dụng phần backend lên Supabase

Bảng `listening_history` đã tồn tại. Kiểm tra chỉ đọc database hiện tại cho thấy bảng có `id`, `user_id`, `track_id`, `journey_id`, `listened_sec`, `completed`, `skipped`, `played_at`, nhưng chưa có `mood_id`, `stage`, `playback_id`.

Mở **Supabase Dashboard → dự án → SQL Editor → New query**, dán toàn bộ nội dung file:

```text
supabase/migrations/202610170001_record_listening_history.sql
```

Sau đó bấm **Run** một lần. File chỉ bổ sung ba cột, một chỉ mục chống trùng và hàm `record_listening_history`; không tạo lại bảng hoặc xóa lịch sử hiện có. Có thể chạy lại file mà không tạo trùng cột/chỉ mục.

Hàm chạy ở backend Supabase, nhận diện tài khoản qua `auth.uid()`, kiểm tra chủ sở hữu journey nếu có, tự tính completed/skipped, rồi ghi lịch sử và cộng play_count trong một giao dịch. Khi một bước lỗi, cả hai bước hoàn tác. Mã playback_id ổn định giúp gửi lại yêu cầu mà không ghi/tăng trùng.

Không cần chạy thêm Express server cho hạng mục này. Ứng dụng gọi hàm qua Supabase RPC với phiên đăng nhập hiện tại. Tham khảo [Supabase Database Functions](https://supabase.com/docs/guides/database/functions).

Phiên triển khai chỉ có public API key, không có quyền thực thi DDL trên Supabase; **file SQL chưa được áp dụng lên database thật**. Không đưa service-role key vào ứng dụng để thực hiện bước này.

## Quy tắc ghi

- Ghi một lượt khi hết bài, chuyển bài hoặc bấm dừng; lỗi phát kết thúc một lượt cũng lưu phần đã nghe đủ ngưỡng.
- Pause/resume không chia một lượt thành nhiều dòng.
- Không ghi khi thời gian nghe thực tế dưới 5 giây; các lượt đó cũng không tăng play_count.
- `listened_sec` là số giây thực sự phát, làm tròn xuống. Đo từ tiến độ file kết hợp đồng hồ đơn điệu; không cộng thời gian pause/buffering hoặc đoạn tua qua.
- `completed = listened_sec >= duration_thực_tế * 0.8`.
- `skipped = chủ động chuyển/dừng bài khi listened_sec < 30`; hết tự nhiên, lỗi phát hoặc đổi tài khoản không bị đánh dấu skipped.
- Hai cờ độc lập: một bài rất ngắn có thể vừa đạt 80% vừa bị chủ động chuyển trước 30 giây.
- Mỗi lượt được ghi tăng `tracks.play_count` thêm 1, kể cả lượt skipped đủ 5 giây.
- Ghi cho tài khoản Supabase thường hoặc phiên khách ẩn danh. Chế độ xem demo chưa có phiên khách thì chưa ghi lịch sử.
- Gắn mood/stage từ hành trình đang phát. Journey tạo ở frontend hiện chưa được lưu vào DB nên `journey_id = null`; khi dùng journey đã lưu, truyền ID thật qua historyContext. Nghe từ thư viện để mood/stage/journey null.
- Hàng đợi gửi lỗi nằm trong bộ nhớ: thử lại khi có lượt mới, app trở về foreground, đăng nhập, hoặc bấm **Thử lưu lại**. Không gửi dữ liệu của tài khoản cũ bằng phiên của tài khoản mới. Đóng/reload hẳn ứng dụng trước khi gửi thành công có thể mất những lượt còn chờ; bản này chưa có hàng đợi offline lưu xuống ổ đĩa.

## Test trên ứng dụng

1. Chạy file SQL ở trên.
2. Khởi động ứng dụng trên nhánh Deip:

   ```powershell
   npx expo start --web --clear
   ```

3. Có thể dùng tài khoản thật hoặc không cần nhập tài khoản: bật **Authentication → Sign In / Providers → Allow anonymous sign-ins** trong Supabase, lưu cấu hình rồi bấm **Dùng chế độ khách để lưu lịch sử nghe** ở trình phát. Nên bấm nút này trước khi bắt đầu bài test. Kiểm tra chỉ đọc trong phiên triển khai cho thấy tùy chọn anonymous hiện đang tắt; chưa thay đổi cài đặt đó trên server.
4. Chọn MP3 dài hơn 10 giây. Ghi lại play_count hiện tại của bài trong bảng tracks.
5. Nghe 3 giây rồi chuyển bài: không thêm lịch sử và không tăng play_count.
6. Nghe 6–10 giây rồi chuyển bài: thêm đúng 1 dòng, listened_sec khoảng số giây thực nghe, skipped=true nếu dưới 30 giây, play_count tăng 1.
7. Nghe trên 80% một bài, để kết thúc: completed=true, skipped=false, tự chuyển bài và không ghi thêm lần thứ hai cho bài vừa hết.
8. Pause 15 giây rồi resume: khoảng pause không được cộng. Thử cả trên mobile.
9. Tua gần cuối ngay khi bắt đầu rồi chờ hết dưới 5 giây: không có lịch sử. Nếu đã thực nghe từ 5 giây nhưng dưới 80%, tua tới cuối cũng không làm completed=true.
10. Bấm dừng hoặc đăng xuất sau khi nghe đủ 5 giây: lượt được chốt. Đăng nhập tài khoản khác và nghe bài mới: user_id phải thuộc tài khoản mới.
11. Thử ngắt mạng khi chuyển bài: nhạc không bị dừng vì lỗi ghi lịch sử; sau khi có mạng, bấm **Thử lưu lại**. Số dòng và play_count chỉ tăng một lần cho lượt đó. Giữ nguyên ứng dụng trong khi thử lại.

SQL kiểm tra dữ liệu, chạy bằng SQL Editor của quản trị viên:

```sql
select h.id, h.user_id, t.title, h.journey_id, h.mood_id, h.stage,
       h.listened_sec, h.completed, h.skipped, h.played_at, h.playback_id
from public.listening_history h
join public.tracks t on t.id = h.track_id
order by h.played_at desc
limit 30;

select id, title, play_count from public.tracks order by title;

-- Không được có kết quả:
select user_id, playback_id, count(*)
from public.listening_history
where playback_id is not null
group by user_id, playback_id
having count(*) > 1;
```

## Kiểm tra tự động

```powershell
node --test scripts/player-service.test.cjs scripts/listening-history.test.cjs
node --test scripts/guest-session.test.cjs
npx tsc --noEmit
npm run lint
```

Kiểm tra SQL thật bằng PostgreSQL nhúng PGlite, cài riêng vào thư mục test (không thêm vào ứng dụng):

```powershell
npm install --prefix .expo/history-db-test --no-package-lock --no-save @electric-sql/pglite
node --test scripts/listening-history-db.test.cjs
```

Bộ SQL test chạy trên database cục bộ, không ghi dữ liệu lên Supabase thật. Các yêu cầu đồng thời được xếp qua engine nhúng; không phải bài kiểm tra tải nhiều kết nối PostgreSQL.

Kết quả kiểm tra phiên triển khai: 25 test trình phát/lịch sử đạt, 8 tình huống SQL đạt (Node báo tổng 34 gồm test bao ngoài); TypeScript đạt; lint không có lỗi, còn 7 cảnh báo có sẵn. Export Web/Android/iOS đã qua. Chưa áp dụng SQL hay ghi lịch sử bằng tài khoản thật trên Supabase.

## File thay đổi

- `supabase/migrations/202610170001_record_listening_history.sql`: backend giao dịch, kiểm tra danh tính, chống trùng và tăng play_count.
- `services/listening-history-tracker.ts`: đo thời gian nghe và chốt lượt.
- `services/listening-history-service.ts`: gửi RPC, chờ gửi lại khi lỗi, tách theo tài khoản.
- `services/guest-session.ts`: tạo phiên khách khi người dùng chọn, dùng lại phiên đã lưu và giữ nguyên tài khoản thường. Phiên khách dùng authenticated role nên vẫn gọi hàm backend hiện có; không cần nới quyền ghi cho anon. Xem [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous). Đăng xuất, xóa dữ liệu trình duyệt hoặc dùng thiết bị khác sẽ tạo danh tính khách khác; không tự gộp lịch sử khách vào tài khoản thường.
- `services/player-service.ts`: chốt lịch sử ở các điểm kết thúc/chuyển/dừng/lỗi, xử lý replay.
- `services/audio-engine.types.ts`, `services/audio-engine.ts`, `services/audio-engine.web.ts`: đọc ngay vị trí thực tại thời điểm chuyển/dừng, tránh mất phần giây cuối giữa các sự kiện.
- `contexts/PlayerContext.tsx`: nối tài khoản thật, thông báo lỗi lưu và retry.
- `app/index.tsx`: truyền mood/stage/journey, chốt lịch sử trước khi đăng xuất thật khỏi Supabase.
- `services/journey-generator.ts`: giữ ID mood trong hành trình để không dùng nhầm lựa chọn đã đổi sau đó.
- `components/moodflow/player/BottomPlayer.tsx`: trạng thái chưa đăng nhập/lỗi lưu và nút thử lại.
- `scripts/test-support.cjs`, `scripts/player-service.test.cjs`, `scripts/listening-history.test.cjs`, `scripts/listening-history-db.test.cjs`: kiểm tra hồi quy và tích hợp SQL.
- `LISTENING_HISTORY_TESTING.md`: hướng dẫn này.
