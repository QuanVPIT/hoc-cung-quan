# 🗣️ Học cùng Quân

App học **tiếng Anh giao tiếp A1 → A2** cho người lớn: từ vựng, mẫu câu, hội thoại, ôn tập ngắt quãng.

👉 Học ngay: https://quanvpit.github.io/hoc-cung-quan/

## Nội dung

20 bài, chia 4 chặng. Mỗi bài có 15 từ vựng, 4 mẫu câu và 2 hội thoại. Nội dung tự soạn theo khung A1–A2.

| Chặng        | Trình độ | Bài                                                                       |
| ------------ | -------- | ------------------------------------------------------------------------- |
| 🌱 Khởi động | A1       | Chào hỏi · Số & giờ · Gia đình · Nghề nghiệp · Một ngày của tôi           |
| 🏙️ Đời sống  | A1+      | Ăn uống · Mua sắm · Hỏi đường · Đi lại · Thời tiết                        |
| 💬 Giao tiếp | A2       | Hẹn gặp · Gọi điện · Khách sạn · Sức khỏe · Sở thích                      |
| 🚀 Tự tin    | A2+      | Kể chuyện quá khứ · Kế hoạch tương lai · So sánh · Nơi làm việc · Du lịch |

## Cách học trong app

- **Từ vựng:** thẻ có emoji, phiên âm IPA, câu ví dụ và giọng đọc.
- **Mẫu câu:** công thức câu, giải thích ngắn bằng tiếng Việt, 3 ví dụ.
- **Hội thoại:** nghe cả đoạn (tô sáng câu đang đọc), bật/tắt bản dịch, che tiếng Anh để luyện nghe, **nhập vai** (app đọc một vai, bạn nói vai còn lại).
- **Luyện tập:** 12 câu gồm trắc nghiệm, điền từ, nghe chép, xếp câu, luyện nói có chấm điểm. Đạt từ 80% là xong bài.
- **Ôn tập ngắt quãng** (kiểu Anki): tự chấm Quên / Khó / Nhớ / Dễ, app tự lên lịch ôn đúng lúc sắp quên.
- **Sổ tay:** tra cứu mọi từ và câu, tìm không cần dấu, đánh dấu ⭐, lọc từ khó.
- **Tiến độ:** chuỗi ngày học, lịch học 12 tuần, sao lưu và khôi phục bằng file.

Giọng đọc dùng giọng có sẵn của trình duyệt. App tự chọn giọng tiếng Anh hay nhất trên máy, và có thể đổi giọng hoặc tốc độ trong Cài đặt. Luyện nói cần trình duyệt có nhận diện giọng nói (Chrome, Edge, Safari).

## Công nghệ

React 18 · TypeScript (strict) · Vite 6 · Tailwind CSS v4 · Vitest · ESLint + Prettier · GitHub Actions + Pages.

## Cấu trúc thư mục

```
src/
├── main.tsx, App.tsx          # khởi động, điều hướng theo #/đường-dẫn
├── index.css                  # màu (sáng / tối), font, hiệu ứng
├── types/content.ts           # kiểu dữ liệu bài học
├── data/
│   ├── build.ts               # chuyển nội dung viết gọn → dữ liệu đầy đủ
│   ├── index.ts               # danh sách chặng, bài, thẻ
│   └── units/u01-….ts … u20   # nội dung từng bài
├── lib/                       # logic thuần, không phụ thuộc giao diện
│   ├── srs.ts                 # thuật toán ôn tập ngắt quãng
│   ├── text.ts                # so câu (nghe chép, chấm nói)
│   ├── tts.ts, speech.ts      # đọc và nghe giọng nói
│   └── date.ts, random.ts, storage.ts, router.ts, cx.ts
├── store/
│   ├── progress.ts            # tiến độ học (hàm thuần, có test)
│   └── AppStore.tsx           # kho dữ liệu dùng chung, lưu vào máy
├── components/                # nút, thẻ, khung trang, micro, chế độ tập trung
├── features/                  # 4 phần của một bài + phiên ôn tập
│   ├── vocab/ phrases/ dialogue/ practice/ review/
└── pages/                     # Lộ trình, Bài học, Ôn tập, Sổ tay, Tiến độ, Cài đặt
```

## Lệnh

```bash
npm install
npm run dev        # chạy thử ở máy
npm run check      # typecheck + lint + test
npm run build      # build ra dist/
npm run format     # định dạng code
```

Mỗi lần đẩy code lên nhánh `main`, GitHub Actions sẽ tự kiểm tra, build và cập nhật trang web.

## Thêm bài mới

1. Tạo `src/data/units/u21-ten-bai.ts` theo mẫu các bài có sẵn. Mỗi từ viết trên một dòng: `từ | nghĩa | ipa | emoji | câu ví dụ | dịch`.
2. Thêm bài vào `UNITS` trong `src/data/index.ts` (và một chặng mới trong `STAGES` nếu cần).
3. Chạy `npm run check`: test sẽ báo nếu thiếu trường, trùng từ, hoặc câu ví dụ không chứa từ đang học.
