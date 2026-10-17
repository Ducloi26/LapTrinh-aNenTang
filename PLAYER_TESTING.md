# 6.2 – Phát MP3 thật (nhánh Deip)

## Chuẩn bị dữ liệu Supabase

Ảnh chụp hiện tại có `tracks.audio_url = https://example.com/demo1.mp3`.
Đây là link mẫu; ứng dụng sẽ báo lỗi rõ ràng thay vì giả lập phát nhạc.

1. Vào **Supabase → Storage**, mở bucket đã chứa MP3.
2. Chọn file → **Get URL / Copy public URL**. Mở URL trên trình duyệt để chắc chắn nghe hoặc tải được file.
3. Sửa `audio_url` của bản ghi tương ứng trong bảng `tracks` thành URL đó.
4. Chuẩn bị ít nhất **hai bài có URL hoạt động** để kiểm tra tự chuyển bài.
5. Tài khoản đang dùng phải có quyền `SELECT` trên bảng `tracks`. Ứng dụng hiện vẫn giữ cơ chế đăng nhập cũ; nếu chưa đăng nhập thì truy vấn dùng quyền anon của Supabase.

Ví dụ cấu trúc URL (thay bằng URL thực tế, không dùng nguyên ví dụ):

```text
https://<project>.supabase.co/storage/v1/object/public/<bucket>/<file>.mp3
```

Luồng mặc định dùng URL public của bucket công khai đã có. Nếu bucket riêng tư, có thể dùng signed URL còn hạn trong `audio_url`; bản này chưa tự gia hạn signed URL. Không cần đổi tên bucket hoặc tên file để khớp dữ liệu demo trong code. Không đưa service-role key vào ứng dụng.

`.env` cần giữ `EXPO_PUBLIC_SUPABASE_URL` và `EXPO_PUBLIC_SUPABASE_ANON_KEY` của dự án; mẫu ở `.env.example`. `EXPO_PUBLIC_MUSIC_BUCKET` chỉ dùng khi tích hợp bài bằng `storagePath` thay vì `audioUrl`.

Nếu báo không đọc được bảng tracks, kiểm tra `.env` không còn URL mẫu như `https://your-project-id.supabase.co`. URL và public API key phải thuộc cùng dự án. Sau khi sửa `.env`, dừng tiến trình Expo cũ bằng Ctrl+C rồi chạy lại `npx expo start --web --clear`; chỉ bấm tải lại trang có thể vẫn dùng cấu hình cũ. Bản triển khai đã bổ sung thông báo riêng cho cấu hình mẫu, lỗi mạng, hết thời gian chờ, API key, phiên đăng nhập, quyền đọc và bảng không tồn tại.

## Test Web

Tại thư mục dự án:

```powershell
git branch --show-current
npx expo start --web --clear
```

1. Xác nhận nhánh là `Deip`. Chờ thư viện tải xong; nếu báo lỗi, kiểm tra mạng/quyền đọc rồi bấm **Tải lại thư viện**.
2. Vào **Nhạc của tôi**, bấm ▶ một bài. Tên bài phải đúng bản ghi `tracks`; nghe được MP3 cùng Binaural nhỏ ở nền.
3. Tạm dừng: cả hai lớp phải dừng. Phát tiếp: nhạc tiếp tục từ vị trí cũ.
4. Bấm thanh tiến trình để tua; âm thanh và số giây cùng thay đổi. Thời lượng hiển thị lấy từ file, không lấy bộ đếm giả.
5. Đổi âm lượng: cả hai lớp cùng thay đổi. Binaural đặt ở **12% mức âm lượng nhạc**; dùng tai nghe stereo để nghe khác biệt hai kênh.
6. Chuyển Deep Work / Relax / Sleep: bài hát không tải lại, lớp Binaural đổi theo preset.
7. Tua bài đầu tới gần cuối, chờ kết thúc: tự chuyển sang bài thứ hai. Cuối hàng đợi sẽ dừng; bấm ▶ để nghe lại bài cuối. Nút bài tiếp/bài trước có thể quay vòng hàng đợi.
8. Tạo hành trình và bấm một bài trong từng giai đoạn: phát đúng bài và cập nhật thông tin giai đoạn khi tự chuyển bài.
9. Chuyển bài nhanh, bấm dừng trong lúc tải, rồi phát lại: bài cũ không được tự phát trở lại.
10. Kiểm tra lỗi bằng bản ghi có URL mẫu/hỏng: hiện lỗi, không chạy tiến độ giả. Khôi phục URL đúng, tải lại thư viện rồi thử lại.

Trình duyệt có thể chặn tự phát sau hiệu ứng tạo hành trình. Khi đó bấm ▶ trực tiếp để cấp quyền phát.

## Test Android / iOS và khóa màn hình

```powershell
npx expo start --clear
```

Có thể dùng Expo Go để kiểm tra phát MP3, tua và chuyển bài cơ bản. Để xác nhận cấu hình phát nền của ứng dụng, cần **development build hoặc bản cài mới** được tạo sau khi sửa `app.json`; chỉ tải lại JavaScript sẽ không áp dụng cấu hình native mới.

Ví dụ nếu máy đã có môi trường Android:

```powershell
npx expo run:android
```

iOS cần máy macOS với Xcode hoặc bản build iOS qua EAS; không build iOS cục bộ từ Windows.

Trên điện thoại thật, làm lại các bước phát/tạm dừng/tua/chuyển bài ở trên. Sau đó:

1. Phát một bài dài hơn 2 phút, khóa màn hình và chờ trên 2 phút; MP3 vẫn tiếp tục.
2. Kiểm tra thông tin bài trên màn hình khóa và nút phát/tạm dừng. Tạm dừng phải dừng cả Binaural.
3. Để bài kết thúc trong khi khóa màn hình; bài kế tiếp tự phát.
4. Mở khóa: tên bài, vị trí và trạng thái khớp âm thanh đang nghe.
5. Thử rút tai nghe hoặc cuộc gọi: nhạc và Binaural phải dừng/khôi phục cùng trạng thái trình phát chính.
6. Đăng xuất hoặc dừng: không còn âm thanh và không còn phiên điều khiển cũ.

iOS đã có `UIBackgroundModes: ["audio"]`. Android dùng foreground media service của `expo-audio` 1.1.1 với quyền phát nền và lockscreen metadata. Không bật ghi âm/microphone.

Tài liệu tham khảo: [Expo Audio](https://docs.expo.dev/versions/latest/sdk/audio/). Code đã đối chiếu trực tiếp API/plugin của **expo-audio 1.1.1 / Expo SDK 54** trong dự án, vì tài liệu mới hơn có thêm tùy chọn plugin chưa có ở phiên bản này.

## Kiểm tra tự động

```powershell
node --test scripts/player-service.test.cjs
npx tsc --noEmit
npm run lint
npx expo export --platform all --output-dir dist/player-check
```

Trên Windows, nếu Hermes không ghi được file tạm trong sandbox, đặt TEMP/TMP vào thư mục của dự án trước khi export:

```powershell
$env:TEMP = Join-Path (Get-Location) '.expo\tmp'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
npx expo export --platform all --output-dir dist/player-check
```

Kiểm tra tự động dùng bộ phát giả để kiểm tra trạng thái/sự kiện, kèm kiểm tra adapter Web/Native và cấu trúc WAV. Chúng không thay thế việc nghe file từ Supabase hoặc kiểm tra khóa màn hình trên thiết bị thật.

Kết quả kiểm tra lần triển khai đầu: export Web/Android/iOS đạt; lint không có lỗi và còn 7 cảnh báo có sẵn ở các thành phần khác. Sau khi sửa .env đang dùng URL mẫu, đã kiểm tra bằng Supabase SDK: HTTP 200, đọc được 8 bài với audio_url, không còn link example.com. Bộ test hiện có 16/16 test đạt. Chưa xác nhận nghe MP3 từ Supabase hay phát nền trên điện thoại thật.

## Các file được tạo/sửa cho hạng mục này

- `services/player-service.ts`: load/play/pause/seek/volume, sự kiện, phối MP3 + Binaural, giải phóng tài nguyên.
- `services/audio-engine.ts`: bộ phát native dùng expo-audio, trạng thái thực và màn hình khóa.
- `services/audio-engine.web.ts`: bộ phát web theo sự kiện media thực, xử lý ended/error và lỗi tự phát của trình duyệt.
- `services/audio-engine.types.ts`: hợp đồng chung giữa các nền tảng.
- `services/track-source.ts`: nguồn URL/Storage và nhận diện bài ổn định.
- `services/track-catalog.ts`: đọc `tracks.audio_url` từ Supabase và chuyển thành thư viện/hành trình.
- `lib/supabase-config.ts`: phát hiện cấu hình thiếu, URL sai hoặc giá trị mẫu; thư viện phân biệt lỗi kết nối, API key, phiên đăng nhập và quyền đọc.
- `contexts/PlayerContext.tsx`: queue/currentIndex/isPlaying/position/duration/volume, tự chuyển bài, hủy thao tác cũ.
- `app/index.tsx`: nối dữ liệu Supabase, trình phát trên cả Web/Mobile, báo lỗi và tải lại thư viện.
- `components/moodflow/my-music/MyMusicPage.tsx`: hiển thị bài từ bảng tracks.
- `components/moodflow/journey/JourneyPage.tsx`: sửa lỗi dấu nháy JSX có sẵn để chạy lint.
- `components/moodflow/player/BottomPlayer.tsx`: điều khiển nhạc thật, tải/lỗi/âm lượng trên mobile.
- `components/moodflow/player/NowPlayingModal.tsx`: hiển thị thời lượng thật.
- `components/moodflow/shared/Icon.tsx`: tên icon phát nhạc tương thích Feather trên mobile.
- `constants/moodflow.ts`: bổ sung id/audioUrl/storagePath/storageBucket cho Track.
- `services/journey-generator.ts`: nhận kho bài thật khi tạo hành trình.
- `app.json`: cấu hình phát nền và plugin audio, tắt quyền microphone không dùng.
- `assets/audio/binaural-deep-work.wav`, `binaural-relax.wav`, `binaural-sleep.wav`: ba vòng lặp stereo tự tạo.
- `scripts/generate-binaural.cjs`: tái tạo ba file WAV.
- `scripts/player-service.test.cjs`: kiểm tra hồi quy trình phát và nguồn dữ liệu.
- `.env.example`: mẫu cấu hình, không chứa thông tin bí mật.
- `PLAYER_TESTING.md`: hướng dẫn này.

Đã chạy `npx expo install expo-audio`; dự án đã có đúng phiên bản `~1.1.1`, nên package.json/package-lock.json không có thay đổi nội dung. `app/_layout.tsx` đã có PlayerProvider từ thay đổi trước đó, không cần sửa thêm cho hạng mục này.
