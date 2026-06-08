# BÁO CÁO KỸ THUẬT: HỆ THỐNG TUYỂN DỤNG VÀ GỢI Ý VIỆC LÀM THÔNG MINH PHÚ QUỐC (PHU QUOC JOBS)

Chào mừng bạn đến với tài liệu báo cáo kỹ thuật và hướng dẫn vận hành của dự án **Phu Quoc Jobs**. Đây là một hệ thống tuyển dụng hiện đại được tích hợp Trí tuệ nhân tạo (AI) và Học sâu (Deep Learning) nhằm tối ưu hóa việc kết nối nhà tuyển dụng với các ứng viên phù hợp tại khu vực Phú Quốc.

---

## 🏗️ 1. Kiến trúc Hệ thống (System Architecture)

Dự án được xây dựng dựa trên mô hình **Microservices lai (Hybrid Architecture)**, tách biệt phần quản trị nghiệp vụ web thông thường và phần xử lý tính toán mô hình trí tuệ nhân tạo (AI/ML).

### Sơ đồ luồng tương tác hệ thống (System Flow Diagram):

```mermaid
graph TD
    %% Định nghĩa các tác nhân
    Candidate([Ứng viên])
    Employer([Nhà tuyển dụng])
    Admin([Quản trị viên])
    
    %% NextJS Web Server
    subgraph Web_Application [Next.js App Router - Port 3000]
        NextJS[Next.js Server]
        Prisma[Prisma Client ORM]
        CookieAuth[HttpOnly JWT Authentication]
    end
    
    %% PostgreSQL Database
    PostgreSQL[(PostgreSQL - Neon Serverless DB)]
    
    %% Django AI Server
    subgraph AI_Services [Django AI Server - Port 8000]
        Django[Django Server]
        TFIDF[TF-IDF Reranker]
        CrossEncoder[Cross-Encoder ms-marco-MiniLM-L-6-v2]
    ```
    
    %% Các kết nối tương tác
    Candidate -->|Đăng ký / Nộp đơn / Chat| NextJS
    Employer -->|Đăng tin / Chấm điểm CV / Đặt lịch| NextJS
    Admin -->|Phê duyệt / Quản lý mô hình| NextJS
    
    NextJS -->|Xác thực phiên| CookieAuth
    NextJS -->|Truy vấn dữ liệu| Prisma
    Prisma -->|Đồng bộ dữ liệu| PostgreSQL
    
    %% Giao tiếp giữa NextJS và Django
    NextJS -->|1. Yêu cầu gợi ý / đối sánh| Django
    Django -->|Đọc CV & Tin tuyển dụng| PostgreSQL
    
    %% Luồng xử lý AI
    Django -->|2. Tiền lọc ứng viên| TFIDF
    Django -->|3. Đánh giá ngữ nghĩa sâu| CrossEncoder
    Django -->|4. Phân tích điểm mạnh & yếu| Gemini[Google Gemini API]
    
    Gemini -->|Trả kết quả văn bản AI| Django
    Django -->|Lưu matchScore trực tiếp| PostgreSQL
    Django -->|5. Trả điểm số & Báo cáo| NextJS
```

### Giải thích quy trình hoạt động (Data Flow Explanation):
1. **Quản trị và Nghiệp vụ (Next.js)**: Đảm nhận phần lớn lưu lượng truy cập của người dùng. Các thao tác CRUD, đặt lịch phỏng vấn, lưu trạng thái đơn ứng tuyển đều được lưu trữ trực tiếp vào cơ sở dữ liệu **PostgreSQL (Neon Cloud)** thông qua **Prisma ORM**.
2. **Xử lý AI (Django)**: Khi có yêu cầu tính toán phức tạp (như gợi ý công việc, chấm điểm tương thích CV), Next.js sẽ gọi một yêu cầu proxy HTTP API sang **Django AI Server (chạy ở port 8000)**.
3. **Độc lập và chia sẻ DB**: Cả Next.js và Django đều dùng chung một chuỗi kết nối `DATABASE_URL` để truy cập trực tiếp vào cùng một cơ sở dữ liệu PostgreSQL. Điều này giúp Django có thể truy vấn thông tin CV và tin tuyển dụng cực nhanh mà không cần Next.js truyền tải toàn bộ dữ liệu văn bản nặng nề qua HTTP payload.
4. **Đối khớp hồ sơ Cross-Encoder**: Django nạp mô hình mạng nơ-ron Transformer trực tiếp từ bộ nhớ cục bộ, thực hiện so sánh chéo ngữ nghĩa, sau đó lưu kết quả điểm số đối khớp (`matchScore`) trực tiếp vào Postgres để Next.js lấy ra hiển thị mà không cần tính toán lại.

---

## 🛠️ 2. Công nghệ Sử dụng & Giải thích Chi tiết (Tech Stack & Explanations)

### 2.1. Phân hệ Web & Quản lý (Thư mục `recruitment-platform`)
*   **Next.js 16 (App Router) & React 19**: Lựa chọn Next.js giúp hệ thống tận dụng cơ chế **Server-Side Rendering (SSR)** và **Incremental Static Regeneration (ISR)** giúp tối ưu điểm SEO cho các trang tin tuyển dụng, đồng thời cung cấp các API Routes gọn nhẹ đóng vai trò như API Gateway.
*   **Prisma Client ORM**: Cung cấp khả năng truy vấn kiểu Type-safe hoàn hảo trong TypeScript. Tự động sinh mã nguồn client tương thích với schema và hỗ trợ quản lý di chuyển schema (migration) mượt mà.
*   **PostgreSQL (Neon Cloud)**: Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ. Neon DB cung cấp tính năng Serverless tự động co giãn và kết nối pooling qua giao thức WebSocket Constructor (`ws`) trên môi trường đám mây đám bảo khả năng chịu tải tốt.
*   **HttpOnly Cookie & JWT (jose)**: Phiên đăng nhập được mã hóa thành JWT và lưu dưới dạng cookie với cờ `HttpOnly`, ngăn chặn hoàn toàn các cuộc tấn công XSS lấy cắp token.
*   **Cloudinary API**: Dịch vụ CDN chuyên nghiệp dùng để quản lý lưu trữ và tối ưu hóa dung lượng hình ảnh đại diện (avatar) của ứng viên hoặc logo của doanh nghiệp.

### 2.2. Phân hệ Trí tuệ nhân tạo (Thư mục `severAI`)
*   **Django & Django REST Framework**: Đóng vai trò là máy chủ dịch vụ tính toán (Computing Service). Python có hệ sinh thái thư viện AI/ML mạnh nhất thế giới nên Django là cầu nối hoàn hảo để tích hợp các mô hình học máy.
*   **Sentence-Transformers & PyTorch (CPU version)**:
    *   Hệ thống sử dụng thư viện `sentence-transformers` được tối ưu hóa trên nền tảng **PyTorch**.
    *   Để tối ưu hóa dung lượng lưu trữ trên máy chủ local, chúng ta cài đặt phiên bản **PyTorch CPU** giúp giảm kích thước gói cài đặt từ vài GB xuống còn vài trăm MB mà vẫn đảm bảo tốc độ phản hồi tính toán tức thời (dưới 1 giây cho mỗi lượt đối khớp).
*   **Mô hình `cross-encoder/ms-marco-MiniLM-L-6-v2`**:
    *   Đây là một mô hình **Cross-Encoder** hiệu năng cao chuyên biệt cho tác vụ Reranking (đánh giá mức độ liên quan ngữ nghĩa giữa 2 văn bản).
    *   *Tại sao dùng Cross-Encoder thay vì Bi-Encoder?* Bi-Encoder mã hóa độc lập 2 câu rồi tính Cosine Similarity, chạy nhanh nhưng bỏ qua mối liên hệ ngữ nghĩa chi tiết. Cross-Encoder đưa cả 2 văn bản vào mô hình cùng lúc, cơ chế **Self-Attention** của Transformer sẽ so sánh từng từ của CV với từng từ của JD, mang lại độ chính xác cực kỳ vượt trội.
*   **Google Gemini API (`gemini-2.5-flash`)**: Sử dụng để phân tích sâu nội dung CV và viết báo cáo lý do đề xuất tuyển dụng chi tiết bằng tiếng Việt vô cùng tự nhiên.

---

## 🌟 3. Báo cáo Chi tiết Tính năng (Detailed Features Report)

### 3.1. Phân hệ Ứng viên (Candidate)
*   **Tìm kiếm & Lọc việc làm thông minh**: Cho phép lọc công việc theo khu vực cụ thể tại Phú Quốc (các phường An Thới, Dương Đông, xã Gành Dầu, v.v.), khoảng lương và yêu cầu kinh nghiệm.
*   **Trắc nghiệm năng lực trực tuyến (Quiz)**: Khi ứng tuyển vào các vị trí yêu cầu bài test, ứng viên sẽ làm bài trắc nghiệm tính giờ trực tiếp trên hệ thống. Kết quả tự động chấm điểm (%) và ghi nhận thời gian làm bài.
*   **Gợi ý việc làm tự động bằng AI**: Khi ứng viên upload CV PDF, hệ thống sử dụng thuật toán TF-IDF để quét nhanh toàn bộ database, lọc ra các công việc tiềm năng, sau đó gửi sang Gemini AI để phân tích và viết lý do đề xuất công việc chi tiết.
*   **Nhắn tin thời gian thực & Thu hồi tin nhắn**: Ứng viên có thể chat trực tiếp với nhà tuyển dụng ngay khi đơn ứng tuyển được duyệt. Cho phép xóa tin nhắn cá nhân (thu hồi) và xóa toàn bộ cuộc hội thoại.

### 3.2. Phân hệ Nhà tuyển dụng (Employer)
*   **Đánh giá hồ sơ bằng mô hình học máy (AI Match Score)**:
    *   Nhà tuyển dụng có một nút **"Chấm điểm CV"** riêng biệt cho mỗi hồ sơ. Khi click, hệ thống gửi yêu cầu sang Django Server.
    *   Mô hình Cross-Encoder sẽ tính toán điểm tương thích ngữ nghĩa thô (Logit). Do phân phối điểm thô của mô hình Cross-Encoder thường bị lệch âm (từ -11.0 đến -2.0), hệ thống áp dụng công thức **Calibrated Sigmoid** (Hàm Sigmoid hiệu chuẩn nhiệt độ) để chuyển đổi:
        $$\text{Score (\%)} = \text{Round}\left(\frac{1}{1 + e^{-\frac{\text{raw\_score} + 6.5}{1.5}}} \times 100\right)$$
    *   Điểm số sau đó được lưu vĩnh viễn vào cột `matchScore` của bảng `applications`. Hệ thống hiển thị trực quan các mức độ phù hợp bằng màu sắc: **Xanh lá (>= 75% - Rất phù hợp)**, **Cam (50% - 74% - Phù hợp trung bình)**, và **Đỏ (< 50% - Ít phù hợp)**.
*   **Gợi ý mức lương đăng tuyển (Salary Predictor)**:
    *   Khi nhà tuyển dụng soạn thảo JD, hệ thống sử dụng mô hình hồi quy Ridge Regression được huấn luyện từ các tin tuyển dụng thực tế trên hệ thống để đưa ra gợi ý mức lương min/max phù hợp nhất dựa trên yêu cầu kinh nghiệm, cấp bậc, loại hình công việc và khu vực địa lý.
*   **Quản lý Hội thoại**: Hỗ trợ xóa tin nhắn đơn lẻ hoặc xóa hoàn toàn lịch sử chat trực tiếp để dọn dẹp không gian làm việc.

### 3.3. Phân hệ Quản trị viên (Admin)
*   **Duyệt tin tuyển dụng & Doanh nghiệp**: Duyệt thủ công bài đăng của nhà tuyển dụng hoặc từ chối kèm phản hồi lý do chi tiết.
*   **Quản lý Vận hành AI**: Cho phép Admin click nút huấn luyện lại (Retrain) mô hình dự báo lương Ridge Regression trực tiếp trên giao diện Admin Panel khi cơ sở dữ liệu cập nhật nhiều tin tuyển dụng mới.

---

## 🚀 4. Hướng dẫn Cài đặt & Vận hành (Local Setup & Run)

### 4.1. Khởi chạy Recruitment Platform (Next.js)
1. Cài đặt các thư viện Node.js:
   ```bash
   cd recruitment-platform
   npm install
   ```
2. Tạo file `.env` cấu hình cơ sở dữ liệu Neon PostgreSQL và Cloudinary:
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_... (Lấy từ Neon console)"
   JWT_SECRET="super-secret-key-123"
   CLOUDINARY_CLOUD_NAME="..."
   CLOUDINARY_API_KEY="..."
   CLOUDINARY_API_SECRET="..."
   NEXT_PUBLIC_USE_CLOUDINARY=true
   ```
3. Sinh mã nguồn client và chạy dev server:
   ```bash
   npx prisma generate
   npm run dev
   ```

### 4.2. Khởi chạy AI Server (Django)
1. Kích hoạt môi trường ảo Python virtualenv:
   * **Windows**:
     ```powershell
     cd severAI
     .\env\Scripts\activate
     ```
   * **macOS/Linux**:
     ```bash
     cd severAI
     source env/bin/activate
     ```
2. Cài đặt các thư viện Python:
   ```bash
   pip install django djangorestframework dj-database-url python-dotenv requests pandas numpy scikit-learn pypdf psycopg2-binary sentence-transformers torch --extra-index-url https://download.pytorch.org/whl/cpu
   ```
   *(Lưu ý: Tham số `--extra-index-url https://download.pytorch.org/whl/cpu` giúp tải phiên bản PyTorch CPU siêu nhẹ, giúp tiết kiệm băng thông và bộ nhớ ổ cứng).*
3. Cấu hình file `.env` trong thư mục `severAI/`:
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_... (Dùng chung database với Next.js)"
   GEMINI_API_KEY="AIzaSy..."
   ```
4. Chạy máy chủ Django:
   ```bash
   python manage.py runserver
   ```
   *(Máy chủ AI sẽ lắng nghe tại cổng `http://127.0.0.1:8000`)*.
