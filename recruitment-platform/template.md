# Hệ thống Xử lý Template CV (Template System Flow)

Tài liệu này mô tả chi tiết luồng xử lý dữ liệu, đăng ký và render các mẫu CV (template) trong hệ thống recruitment platform, đi qua từng file và từng hàm cụ thể.

---

## I. Tổng quan Kiến trúc
Hệ thống CV template được xây dựng trên mô hình **React Component-driven**:
1. **Dữ liệu nguồn**: Lưu trữ trong cơ sở dữ liệu (Prisma / PostgreSQL) dưới dạng JSON hoặc các trường thông tin quan hệ (`education`, `experience`, `projects`, `socialLinks`,...).
2. **Template Registry**: Một file trung tâm đăng ký tất cả các mẫu thiết kế (`TemplateClassic`, `TemplateModern`, v.v.) ánh xạ từ `slug` trong database sang React component tương ứng.
3. **Hai luồng kết xuất (Render Flow)**:
   - **Luồng 1 (Giao diện React)**: Render trực tiếp React Component trên Client/Server để xem, sửa trực quan (Interactive Preview).
   - **Luồng 2 (HTML tĩnh để In/Tải xuống)**: Chuyển đổi React Component thành chuỗi HTML tĩnh nhờ `react-dom/server` phía backend API để in hoặc tải PDF sạch sẽ.

---

## II. Chi tiết từng File & Từng Hàm

### 1. File Đăng ký Template: [template/index.js](file:///home/ngoan/doanthu/recruitment-platform/template/index.js)
Đóng vai trò là Registry trung tâm cho tất cả các thiết kế CV.

* **`TEMPLATE_MAP` (Object)**:
  * **Mô tả**: Ánh xạ `slug` (ví dụ: `"classic"`, `"modern"`, `"creative"`, `"elegant"`, `"futuristic"`, `"minimalist"`) sang React Component tương ứng.
  * **Mục đích**: Giúp các trang/api render linh hoạt động bằng cách gọi `TEMPLATE_MAP[slug]` mà không cần viết nhiều khối lệnh điều kiện `switch-case`.

---

### 2. File UI View CV: [app/cv/[id]/page.tsx](file:///home/ngoan/doanthu/recruitment-platform/app/cv/%5Bid%5D/page.tsx)
Trang hiển thị CV trực tuyến (Server Component) khi truy cập đường dẫn `/cv/[id]`.

* **`CvPage({ params })` (Default Export)**:
  1. **Nhận đầu vào**: Lấy `id` của CV từ URL params.
  2. **Truy vấn DB**: Dùng `prisma.resume.findUnique` lấy dữ liệu resume cùng thông tin user và slug của template (`resume.template.slug`).
  3. **Lấy Component**: Xác định component template bằng cách tra cứu: `TemplateComponent = TEMPLATE_MAP[slug] || TEMPLATE_MAP["classic"]`.
  4. **Chuẩn hóa dữ liệu (Normalize)**: Gom dữ liệu từ các quan hệ DB thành 2 object chuẩn:
     - `user`: Tên, email, số điện thoại, ảnh đại diện.
     - `resumeData`: Địa chỉ, tóm tắt, bằng cấp, học vấn, kinh nghiệm, dự án, mạng xã hội.
  5. **Render**: Trả về giao diện bao gồm:
     - Thẻ `<TemplateComponent user={user} resume={resumeData} />`.
     - Nhúng Tailwind CSS CDN và Google Fonts.
     - CSS đặc biệt để ẩn các nút/form chỉnh sửa khi in (`@media print` và `.print:hidden`).
     - Script tự động kích hoạt hộp thoại In (`window.print()`) nếu URL chứa tham số `?print=true`.

---

### 3. File API Render HTML tĩnh: [app/api/resumes/[id]/render/route.ts](file:///home/ngoan/doanthu/recruitment-platform/app/api/resumes/%5Bid%5D/render/route.ts)
API Endpoint (`GET /api/resumes/[id]/render`) trả về chuỗi HTML hoàn chỉnh của CV, thường dùng cho mục đích xuất file hoặc hiển thị cô lập.

* **`GET(_req, { params })` (Export Function)**:
  1. **Lấy tham số**: Đọc `id` của resume từ params.
  2. **Truy vấn DB**: Truy vấn dữ liệu resume và thông tin user tương tự như ở trang xem trực tuyến.
  3. **Xác định template**: Lấy slug mẫu thiết kế (mặc định là `"classic"`).
  4. **Gọi hàm render server**: Chuyển dữ liệu và slug vào hàm `renderReactTemplate` của thư viện `renderResumeServer.ts`.
  5. **Trả về Response**: Xuất ra HTML string thuần với Header `Content-Type: text/html; charset=utf-8`.

---

### 4. File Helper Server-side Render: [lib/renderResumeServer.ts](file:///home/ngoan/doanthu/recruitment-platform/lib/renderResumeServer.ts)
Chứa các hàm render React Component thành chuỗi HTML tĩnh trên môi trường Node.js (Server-side).

* **`renderReactTemplate(slug, user, resume)`**:
  * **Đầu vào**: `slug` của template, thông tin `user` và thông tin `resume`.
  * **Xử lý**:
    - Sử dụng `require('react-dom/server')` động để lấy hàm `renderToStaticMarkup` (tránh xung đột Hydration trên client).
    - Tạo một React Element từ template tương ứng: `React.createElement(TemplateComponent, { user, resume })`.
    - Dùng `renderToStaticMarkup` để render component này ra chuỗi HTML (loại bỏ hoàn toàn các thuộc tính React nội bộ).
  * **Đầu ra**: Bọc chuỗi HTML đó trong một tài liệu HTML5 chuẩn chứa đầy đủ Tailwind CSS, Font Inter, Font Material Icons, và cấu hình CSS vô hiệu hóa các trường input (chuyển sang dạng read-only) cùng nút bấm In/PDF nhanh.

* **`buildReactResumePreview(slug, user, resume)`**:
  * **Mô tả**: Hàm dự phòng. Nếu `slug` hợp lệ, nó gọi `renderReactTemplate`. Ngược lại, nó tự convert thông tin sang định dạng thô và trả về giao diện fallback HTML cổ điển thông qua hàm `renderResumeFallback` của file `renderResume.ts`.

---

### 5. File Tiện ích & Render Fallback: [lib/renderResume.ts](file:///home/ngoan/doanthu/recruitment-platform/lib/renderResume.ts)
*Lưu ý: File này chứa các giải pháp render chuỗi HTML bằng Regex/String Replace kế thừa từ phiên bản cũ (Fallback), hiện tại chủ yếu sử dụng các hàm Parser và Types.*

* **`parseResumeJson<T>(json)`**:
  * **Đầu vào**: Dữ liệu dạng `json` lưu trong DB (do Prisma lưu kiểu JSON).
  * **Đầu ra**: Mảng đối tượng đã được parse an toàn dạng `T[]` để hiển thị. Tránh lỗi runtime khi dữ liệu rỗng.

* **`renderResumeFallback(data)`**:
  * **Mục đích**: Sinh ra chuỗi HTML thô (không có template) biểu diễn thông tin CV theo dạng danh sách cơ bản để làm phương án dự phòng khi hệ thống không tải được React Template.

* **`renderTemplateHtml(htmlContent, data, options)`**:
  * **Mục đích**: Thay thế các placeholder dạng `{{name}}`, `{{#each education}}` trong chuỗi HTML tĩnh bằng dữ liệu thực tế (giống Handlebars đơn giản). Hiện tại ít được dùng do đã chuyển sang React Component.

* **`buildPreviewDocument(html, css)`**:
  * **Mục đích**: Bọc đoạn mã HTML cv vào trong khung thẻ `<html>`, `<head>`, `<body>` hoàn chỉnh có kèm CDN Tailwind CSS.

* **`buildResumePreview(data, template)`**:
  * **Mục đích**: Hàm gộp quyết định xem sẽ render template chuỗi HTML bằng `renderTemplateHtml` hay render thô bằng `renderResumeFallback`.

---

### 6. File Template Chi tiết (Ví dụ: [TemplateClassic.jsx](file:///home/ngoan/doanthu/recruitment-platform/template/TemplateClassic.jsx))
Mỗi file template biểu diễn một phong cách thiết kế giao diện CV.

* **`TemplateClassic({...})` (Default Export)**:
  * **Chế độ hoạt động kép (Dual-mode)**:
    1. **Chế độ Chỉnh sửa (Editor Mode - isControlled = false)**:
       - Tự quản lý state cục bộ bằng `localUserData`, `localResumeData`.
       - Lấy dữ liệu lưu nháp từ `localStorage`.
       - Hiển thị các trường dưới dạng `<input>` và `<textarea>` cho phép gõ trực tiếp, thêm/bớt các mục Học vấn, Kinh nghiệm bằng các nút bấm "+ Thêm", "Xóa".
       - Có nút "Lưu thay đổi" vào trình duyệt và nút "In / Xuất PDF" trực tiếp.
    2. **Chế độ Xem/In (Read-only Mode - isControlled = true)**:
       - Dữ liệu hoàn toàn được truyền từ props (`controlledUserData`, `controlledResumeData`).
       - Toàn bộ các thẻ `<input>` và `<textarea>` bị khóa chỉnh sửa (được disable/readonly qua style và script đi kèm). Giao diện hiển thị sạch như một trang văn bản thông thường.
  * **Hàm hỗ trợ nội bộ**:
    - `handleSave`: Lưu dữ liệu tạm vào LocalStorage hoặc gọi hàm `onSave` từ component cha.
    - `handleArrayChange`, `addArrayItem`, `removeArrayItem`: Xử lý thêm, sửa, xóa các phần tử trong danh sách (Kinh nghiệm, Học vấn, Mạng xã hội, Dự án).
    - Component con `Section`: Render tiêu đề phân mục có nút bấm thêm nhanh tiện lợi.
