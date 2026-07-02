# Hướng dẫn cấu hình gửi Email qua SMTP (Gmail)

Tài liệu này hướng dẫn cách cấu hình chi tiết SMTP bằng tài khoản Gmail cá nhân hoặc doanh nghiệp để nền tảng Tuyển dụng gửi thư thành công tới ứng viên.

---

## 1. Các biến cấu hình trong `.env`

Mở file `.env` ở thư mục gốc của dự án và điền thông tin tương ứng dưới đây:

```env
# SMTP Mail Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="dia_chi_email_cua_ban@gmail.com"
SMTP_PASS="ma_mat_khau_ung_dung_16_ky_tu"
SMTP_FROM="dia_chi_email_cua_ban@gmail.com"
```

---

## 2. Các bước lấy Mật khẩu ứng dụng (App Password) từ Google

Vì chính sách bảo mật của Google, bạn không thể sử dụng mật khẩu đăng nhập Gmail trực tiếp. Thay vào đó, bạn phải tạo **Mật khẩu ứng dụng (App Password)**:

### Bước 1: Bật Xác minh 2 bước (2-Step Verification)
1. Truy cập vào trang [Quản lý tài khoản Google](https://myaccount.google.com/).
2. Chọn mục **Bảo mật** (Security) ở menu bên trái.
3. Ở phần **Cách bạn đăng nhập vào Google**, hãy đảm bảo **Xác minh 2 bước** (2-Step Verification) đang ở trạng thái **Đang bật** (On).

### Bước 2: Tạo Mật khẩu ứng dụng (App Password)
1. Ở ô Tìm kiếm phía trên cùng của trang tài khoản Google, gõ từ khóa: **"Mật khẩu ứng dụng"** (hoặc **"App passwords"** nếu dùng tiếng Anh).
2. Chọn kết quả tìm kiếm **Mật khẩu ứng dụng**.
3. Google sẽ yêu cầu bạn nhập lại mật khẩu Gmail để xác minh danh tính.
4. Ở trang Mật khẩu ứng dụng:
   - Nhập tên ứng dụng tự chọn (ví dụ: `Recruitment Platform`).
   - Nhấp vào nút **Tạo** (Create).
5. Một cửa sổ hiện ra chứa **mã mật khẩu ứng dụng gồm 16 ký tự** (dạng viết liền, ví dụ: `abcd efgh ijkl mnop`).
6. Hãy sao chép mã 16 ký tự này (không bao gồm dấu cách) và dán vào biến `SMTP_PASS` trong file `.env`.

---

## 3. Kiểm tra tính năng

1. Khởi động lại Server Next.js (`npm run dev`) để cập nhật lại các biến môi trường từ file `.env`.
2. Truy cập vào trang quản trị của Nhà tuyển dụng (Employer Dashboard) -> Mục **Quản lý đơn ứng tuyển**.
3. Chọn một ứng viên và thay đổi trạng thái sang **Chấp nhận** hoặc **Từ chối**.
4. Viết tiêu đề và nội dung thư nháp -> Nhấp **Xác nhận & Gửi**.
5. Kiểm tra hòm thư của ứng viên để xác nhận đã nhận được thư thành công.
