# 6.2 – Phát MP3 thật (nhánh Deip)

## Chuẩn bị dữ liệu Supabase

`tracks.audio_url` phải chứa URL MP3 hoạt động. `https://example.com/demo1.mp3` trong ảnh trước đây là link mẫu; nếu còn dùng, ứng dụng sẽ báo lỗi phát.

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

`frontend/.env` cần giữ `EXPO_PUBLIC_SUPABASE_URL` và `EXPO_PUBLIC_SUPABASE_ANON_KEY` của dự án; mẫu ở `frontend/.env.example`. `EXPO_PUBLIC_MUSIC_BUCKET` chỉ dùng khi tích hợp bài bằng `storagePath` thay vì `audioUrl`.

Nếu báo không đọc được bảng tracks, kiểm tra `frontend/.env` không còn URL mẫu như `https://your-project-id.supabase.co`. URL và public API key phải thuộc cùng dự án. Sau khi sửa `frontend/.env`, dừng tiến trình Expo cũ bằng Ctrl+C rồi chạy lại `npm run web -- --clear`; chỉ bấm tải lại trang có thể vẫn dùng cấu hình cũ. Bản triển khai đã bổ sung thông báo riêng cho cấu hình mẫu, lỗi mạng, hết thời gian chờ, API key, phiên đăng nhập, quyền đọc và bảng không tồn tại.

## Test Web

Tại thư mục dự án:

```powershell
git branch --show-current
npm run web -- --clear
```

1. Xác nhận nhánh là `Deip`. Chờ thư viện tải xong; nếu báo lỗi, kiểm tra mạng/quyền đọc rồi bấm **Tải lại thư viện**.
2. Vào **Nhạc của tôi → Bài hát đã lưu** để thấy kho bài thật, bấm ▶ một bài. Tên bài phải đúng bản ghi `tracks`; nghe được MP3 cùng Binaural nhỏ ở nền.
3. Tạm dừng: cả hai lớp phải dừng. Phát tiếp: nhạc tiếp tục từ vị trí cũ.
4. Bấm thanh tiến trình để tua; âm thanh và số giây cùng thay đổi. Thời lượng hiển thị lấy từ file, không lấy bộ đếm giả.
5. Đổi âm lượng: cả hai lớp cùng thay đổi. Binaural đặt ở **12% mức âm lượng nhạc**; dùng tai nghe stereo để nghe khác biệt hai kênh.
6. Chuyển Deep Work / Relax / Sleep: bài hát không tải lại, lớp Binaural đổi theo preset.
7. Mở **Cài đặt → Tần số tham chiếu**, chọn 432 Hz hoặc 440 Hz rồi phát lại synth. Binaural phải giữ đúng độ lệch của preset; hợp âm nền đổi mỗi 8 giây và chuyển mượt.
8. Thử các hoạt động Thiền định, Giấc ngủ và Tập luyện để lần lượt chọn Theta (6 Hz), Delta (2 Hz) và Gamma (35 Hz). Thư giãn/sáng tạo dùng Alpha (10 Hz), Deep Work dùng Beta (20 Hz).
9. Tua bài đầu tới gần cuối, chờ kết thúc: tự chuyển sang bài thứ hai. Cuối hàng đợi sẽ dừng; bấm ▶ để nghe lại bài cuối. Nút bài tiếp/bài trước có thể quay vòng thư viện. Trong hành trình, đi hết bài cuối sẽ mở đánh giá phiên theo chức năng từ main.
10. Tạo hành trình và bấm một bài trong từng giai đoạn: phát đúng bài và cập nhật thông tin giai đoạn khi tự chuyển bài.
11. Chuyển bài nhanh, bấm dừng trong lúc tải, rồi phát lại: bài cũ không được tự phát trở lại.
12. Kiểm tra lỗi bằng bản ghi có URL mẫu/hỏng: hiện lỗi, không chạy tiến độ giả. Khôi phục URL đúng, tải lại thư viện rồi thử lại.

Trình duyệt có thể chặn tự phát sau hiệu ứng tạo hành trình. Khi đó bấm ▶ trực tiếp để cấp quyền phát.

Web Audio Synth dùng Web Audio API trên trình duyệt. Trên mobile, không hỗ trợ hai oscillator stereo tùy chỉnh; chỉ phát lớp binaural đóng gói có sẵn cho preset Deep Work, Relax và Sleep, các preset Theta/Gamma sẽ bỏ qua lớp binaural.

## Test Android / iOS và khóa màn hình

```powershell
npm start -- --clear
```

Có thể dùng Expo Go để kiểm tra phát MP3, tua và chuyển bài cơ bản. Để xác nhận cấu hình phát nền của ứng dụng, cần **development build hoặc bản cài mới** được tạo sau khi sửa `frontend/app.json`; chỉ tải lại JavaScript sẽ không áp dụng cấu hình native mới.

Ví dụ nếu máy đã có môi trường Android:

```powershell
cd frontend
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
node --test frontend/tests/player/player-service.test.cjs
npm run typecheck
npm run lint
cd frontend
npx expo export --platform all --output-dir dist/player-check
```

Trên Windows, nếu Hermes không ghi được file tạm trong sandbox, đặt TEMP/TMP vào thư mục của dự án trước khi export:

```powershell
$env:TEMP = Join-Path (Get-Location) '.expo\tmp'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
cd frontend
npx expo export --platform all --output-dir dist/player-check
```

Kiểm tra tự động dùng bộ phát giả để kiểm tra trạng thái/sự kiện, kèm kiểm tra adapter Web/Native và cấu trúc WAV. Chúng không thay thế việc nghe file từ Supabase hoặc kiểm tra khóa màn hình trên thiết bị thật.

Sau khi sắp xếp thư mục, dùng `npm test` để chạy toàn bộ test trình phát/lịch sử và tích hợp hành trình. Các kiểm tra tự động không xác nhận việc nghe MP3 từ Supabase hoặc phát nền trên thiết bị thật; vẫn cần các bước thử ở trên.

## Các file được tạo/sửa cho hạng mục này

- `frontend/services/player-service.ts`: load/play/pause/seek/volume, sự kiện, phối MP3 + Binaural, giải phóng tài nguyên.
- `frontend/services/audio-engine.ts`: bộ phát native dùng expo-audio, trạng thái thực và màn hình khóa.
- `frontend/services/audio-engine.web.ts`: bộ phát web theo sự kiện media thực, xử lý ended/error và lỗi tự phát của trình duyệt.
- `frontend/services/audio-engine.types.ts`: hợp đồng chung giữa các nền tảng.
- `frontend/services/track-source.ts`: nguồn URL/Storage và nhận diện bài ổn định.
- `frontend/services/track-catalog.ts`: đọc `tracks.audio_url` từ Supabase và chuyển thành thư viện/hành trình.
- `frontend/lib/supabase-config.ts`: phát hiện cấu hình thiếu, URL sai hoặc giá trị mẫu; thư viện phân biệt lỗi kết nối, API key, phiên đăng nhập và quyền đọc.
- `frontend/contexts/PlayerContext.tsx`: queue/currentIndex/isPlaying/position/duration/volume, tự chuyển bài, hủy thao tác cũ.
- `frontend/app/index.tsx`: nối dữ liệu Supabase, trình phát trên cả Web/Mobile, báo lỗi và tải lại thư viện.
- `frontend/components/moodflow/my-music/MyMusicPage.tsx`: hiển thị bài từ bảng tracks.
- `frontend/components/moodflow/journey/JourneyPage.tsx`: sửa lỗi dấu nháy JSX có sẵn để chạy lint.
- `frontend/components/moodflow/player/BottomPlayer.tsx`: điều khiển nhạc thật, tải/lỗi/âm lượng trên mobile.
- `frontend/components/moodflow/player/NowPlayingModal.tsx`: hiển thị thời lượng thật.
- `frontend/components/moodflow/shared/Icon.tsx`: tên icon phát nhạc tương thích Feather trên mobile.
- `frontend/constants/moodflow.ts`: bổ sung id/audioUrl/storagePath/storageBucket cho Track.
- `frontend/services/journey-generator.ts`: nhận kho bài thật khi tạo hành trình.
- `frontend/app.json`: cấu hình phát nền và plugin audio, tắt quyền microphone không dùng.
- `frontend/assets/audio/binaural-deep-work.wav`, `binaural-relax.wav`, `binaural-sleep.wav`: ba vòng lặp stereo tự tạo.
- `frontend/scripts/generate-binaural.cjs`: tái tạo ba file WAV.
- `frontend/tests/player/player-service.test.cjs`: kiểm tra hồi quy trình phát và nguồn dữ liệu.
- `frontend/.env.example`: mẫu cấu hình, không chứa thông tin bí mật.
- `docs/testing/PLAYER_TESTING.md`: hướng dẫn này.

Dependency `expo-audio ~1.1.1` hiện được khai báo trong `frontend/package.json`; `frontend/app/_layout.tsx` chứa PlayerProvider. Xem [danh sách đầy đủ sau merge](../PLAYER_HISTORY_FILES.md).
