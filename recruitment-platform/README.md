This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
#   b a o c a o c h u n g  
 #   j o b p q n v s m t  

## Tính năng mới: Trình tạo & Chỉnh sửa CV chia màn hình (CV Builder)

Nền tảng đã được nâng cấp hệ thống thiết kế CV chuyên nghiệp, hỗ trợ tương tác chia đôi màn hình (Split-Screen) thời gian thực và quản lý thứ tự các mục lớn linh hoạt.

### Các thành phần chính:
- **Sidebar Form (Bên trái)**: Cho phép nhập liệu trực quan theo từng phần (Thông tin liên hệ, Về tôi, Học vấn, Kinh nghiệm, Dự án, Ngôn ngữ & Kỹ năng).
- **Xem trước thời gian thực (Bên phải)**: Render mẫu CV (A4 Sheet) tức thì khi người dùng đang nhập liệu.
- **Quản lý thứ tự (`SectionOrderManager`)**: Cho phép sắp xếp thứ tự hiển thị của các phần lớn (Học vấn, Dự án, Kinh nghiệm...) bằng các nút mũi tên, dữ liệu được lưu động vào thuộc tính `sectionOrder` trong trường `cvData`.

### Luồng Dữ liệu & Hoạt động (Data Flow)

```mermaid
graph TD
    A[Ứng viên truy cập tao-cv / sua-cv] --> B[Tải dữ liệu ban đầu: Profile, CV cũ & Template]
    B --> C{Lựa chọn chế độ hiển thị}
    C -- Split-Screen (Chia đôi) --> D[Hiển thị Sidebar Form bên trái & Live Preview bên phải]
    C -- Inline Mode (Toàn màn hình) --> E[Hiển thị CV & chỉnh sửa trực tiếp trên CV]
    
    D --> F[Nhập thông tin / Thay đổi thứ tự các phần]
    F --> G[Cập nhật State ở Page cha]
    G --> H[Truyền Props xuống Template Component]
    H --> I[Template render lại thời gian thực theo sectionOrder]
    
    I --> J[Click nút Lưu CV]
    J --> K{Kiểm tra ảnh đại diện}
    K -- Là ảnh local (blob url) --> L[Upload ảnh lên Cloudinary lấy URL mới]
    K -- Đã là URL/Ảnh sẵn có --> M[Gửi API lưu dữ liệu]
    L --> M
    
    M --> N[Prisma lưu dữ liệu JSON & cvData.sectionOrder vào DB PostgreSQL]
    N --> O[Chuyển hướng về trang danh sách CV]
```

## Tính năng mới: Bài kiểm tra năng lực trực tuyến (Online Assessment / Skill Quiz)

Tính năng này giúp nhà tuyển dụng dễ dàng đánh giá trình độ chuyên môn của ứng viên thông qua các bài trắc nghiệm trực tuyến có giới hạn thời gian đi kèm với tin tuyển dụng.

### Các thành phần chính:
- **Quản lý bài test (Employer)**: Nhà tuyển dụng có thể tạo mới, chỉnh sửa, xóa các đề thi trắc nghiệm (soạn câu hỏi, các đáp án lựa chọn và đáp án đúng) cùng với thiết lập giới hạn thời gian (phút).
- **Đính kèm bài test vào tin tuyển dụng**: Khi đăng tin (`JobForm`), nhà tuyển dụng có quyền chọn đính kèm một bài test năng lực (hoặc bỏ trống nếu không muốn làm test).
- **Giao diện làm bài trắc nghiệm (Candidate)**: Ứng viên làm bài trong thời gian quy định với đồng hồ đếm ngược thời gian thực (Countdown Timer), giao diện chuyển câu hỏi linh hoạt, hỗ trợ lưu đáp án tạm thời và tự động nộp bài khi hết giờ.
- **Server-side Validation & Chấm điểm**: Kết quả thi được gửi lên server và chấm điểm trực tiếp tại API để bảo mật (tránh rò rỉ đáp án đúng ở client). Hệ thống lưu điểm (%) và thời gian làm bài vào bảng `Application`.
- **Xem kết quả ứng tuyển**: Hiển thị trực quan điểm test tại danh sách ứng tuyển của Employer giúp lọc nhanh ứng viên xuất sắc.

### Luồng Dữ liệu & Hoạt động (Data Flow)

```mermaid
graph TD
    A[Nhà tuyển dụng tạo bài test năng lực] --> B[Nhà tuyển dụng đăng tin tuyển dụng & chọn đính kèm bài test]
    B --> C[Ứng viên bấm nút Ứng tuyển]
    C --> D{Tin tuyển dụng có đính kèm bài test?}
    
    D -- Không --> E[Ứng tuyển trực tiếp bằng CV & Thư giới thiệu]
    D -- Có --> F[Xác nhận thông tin CV -> Hiển thị thông tin bài test yêu cầu]
    
    F --> G[Bấm Bắt đầu làm bài -> Đồng hồ đếm ngược chạy]
    G --> H[Client fetch câu hỏi bảo mật - đã ẩn đáp án đúng]
    H --> I[Ứng viên hoàn thành trả lời các câu hỏi]
    I --> J{Bấm Nộp bài hoặc Hết thời gian?}
    
    J -- Có --> K[Gửi answers và duration lên API Applications]
    K --> L[Server truy vấn đáp án chính xác trong DB & Tính điểm %]
    L --> M[Lưu Application kèm theo quizScore & quizDuration]
    M --> N[Tạo thông báo & Hiển thị điểm số cho Nhà tuyển dụng xem xét]
```

## Tính năng mới: Bản đồ Định vị tuyển dụng & Tính quãng đường đi làm (Leaflet.js & OpenStreetMap)

Tính năng này tích hợp bản đồ tương tác mã nguồn mở (100% miễn phí) giúp nhà tuyển dụng định vị cơ sở làm việc chính xác và hỗ trợ ứng viên ước tính quãng đường, lộ trình di chuyển thực tế.

### Các thành phần chính:
- **Định vị điểm tuyển dụng (Employer)**: Nhà tuyển dụng có thể ghim địa điểm làm việc trên bản đồ khi tạo/sửa tin tuyển dụng thông qua:
  - Tìm kiếm nhanh bằng địa chỉ văn phòng (Nominatim API).
  - Nhấp chuột trực tiếp lên bản đồ hoặc kéo thả Marker.
  - Tự nhập tọa độ vĩ độ (Latitude) và kinh độ (Longitude) thủ công.
- **Bản đồ chi tiết công việc (Candidate)**: Hiển thị ghim văn phòng công ty tuyển dụng dạng icon **🏢 (Office)** bắt mắt trên nền bản đồ tối giản CartoDB Positron.
- **Tính quãng đường đi làm (Commute Calculator)**: Ứng viên có thể bấm nút mở rộng công cụ tính khoảng cách từ nhà đến nơi làm việc bằng cách:
  - Lấy GPS hiện tại từ trình duyệt (`navigator.geolocation`).
  - Gõ địa chỉ nhà riêng hoặc tự điền tọa độ thủ công.
- **Vẽ hành trình thực tế (Glowing Route Path)**: Hệ thống gọi API định tuyến miễn phí OSRM để vẽ đường đi thực tế dưới dạng **đường viền phát sáng Glowing Route** nối từ vị trí ứng viên **🏠 (Home)** đến nơi làm việc **🏢 (Office)**, đồng thời hiển thị khoảng cách lái xe (km) và thời gian di chuyển dự kiến (phút).
  - *Tốc độ tính toán*: OSRM sử dụng tốc độ định tuyến đường bộ thực tế dựa trên phân loại đường của Phú Quốc (trục chính ĐT45/ĐT47: 50-60 km/h; nội thị Dương Đông/An Thới: 30-40 km/h; đường dân sinh nhỏ: 15-25 km/h).
- **Cơ chế dự phòng (Fallback)**: Nếu dịch vụ OSRM không phản hồi, bản đồ sẽ tự vẽ đường thẳng (đường chim bay) và tính khoảng cách theo công thức lượng giác Haversine để đảm bảo trải nghiệm không bị gián đoạn.
  - *Thời gian dự phòng*: Nếu OSRM bị ngắt kết nối, hệ thống sẽ sử dụng tốc độ xe máy trung bình trên đảo là **40 km/h** để ước lượng thời gian đi làm dự phòng.

### Luồng Dữ liệu & Hoạt động (Data Flow)

```mermaid
graph TD
    A[Nhà tuyển dụng nhập thông tin Job] --> B[Chọn vị trí trên bản đồ / Tìm địa chỉ / Nhập tọa độ]
    B --> C[Gửi API lưu Job kèm latitude & longitude Float vào DB]
    
    D[Ứng viên mở trang chi tiết Job] --> E[Client tải động JobMapDisplay loại bỏ SSR]
    E --> F[Bản đồ render vị trí công ty với icon 🏢]
    
    F --> G[Ứng viên click Tính quãng đường đi làm]
    G --> H{Chọn phương thức lấy vị trí xuất phát}
    
    H -- GPS điện thoại/máy tính --> I[Trình duyệt lấy tọa độ GPS hiện tại]
    H -- Gõ địa chỉ nhà riêng --> J[OSM Nominatim Geocode địa chỉ sang tọa độ]
    H -- Nhập tọa độ thủ công --> K[Sử dụng trực tiếp tọa độ nhập vào]
    
    I --> L[Call OSRM API lấy dữ liệu chỉ đường đường bộ]
    J --> L
    K --> L
    
    L --> M{OSM Router hoạt động tốt?}
    M -- Có --> N[Vẽ tuyến đường đi kép phát sáng & Tính km thực tế + số phút di chuyển]
    M -- Không --> O[Vẽ đường thẳng chim bay & Tính km bằng công thức Haversine]
    
    N --> P[Căn chỉnh khung hình fitBounds hiển thị trọn vẹn hành trình 🏠 ➔ 🏢]
    O --> P
```