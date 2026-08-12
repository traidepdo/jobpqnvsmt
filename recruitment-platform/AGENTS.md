<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Quy tắc cấu trúc code (Code Architecture Rules)

- **Server Components làm Entrypoint**: Các file `page.tsx` trong thư mục `app/` phải là Server Components. Chúng chịu trách nhiệm fetch dữ liệu và truyền xuống các Client Components.
- **Client Components theo chức năng**: Chia nhỏ giao diện thành các Client Components nằm trong thư mục tương ứng của từng chức năng dưới `components/` (ví dụ: `components/jobs/`).
- **Sử dụng Service trực tiếp thay vì tạo API**: Khi cần lấy (fetch) hoặc thay đổi (mutate) dữ liệu, hãy import và gọi trực tiếp các hàm service trong thư mục `lib/` thay vì tạo các API Routes nội bộ (`app/api/...`).
- **Chia nhỏ component (Single Responsibility)**: Chia nhỏ code thành nhiều component chuyên biệt, mỗi component chỉ xử lý một chức năng riêng để tối ưu hóa việc quản lý và tái sử dụng code.
