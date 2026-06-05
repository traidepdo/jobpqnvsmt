// prisma/seed-template.ts
import * as dotenv from "dotenv";
// 1. Nạp biến môi trường từ file .env vào process.env trước
dotenv.config();

import { PrismaClient } from "@prisma/client";

// 2. Khởi tạo trống rỗng, Prisma sẽ tự động map DATABASE_URL từ process.env
const prisma = new PrismaClient();

const TEMPLATE_HTML = `
<div class="cv-wrap">
  <div class="cv-left">
    <div class="cv-avatar">
      {{#if avatar}}
        <img src="{{avatar}}" alt="avatar" />
      {{/if}}
    </div>
    <div class="cv-name">{{name}}</div>
    <div class="cv-job">{{title}}</div>

    <div class="cv-divider"></div>

    <div class="cv-section-label">LIÊN HỆ</div>
    <div class="cv-contact-item"><span class="cv-icon">✉</span><span>{{email}}</span></div>
    <div class="cv-contact-item"><span class="cv-icon">📞</span><span>{{phone}}</span></div>
    <div class="cv-contact-item"><span class="cv-icon">📍</span><span>{{address}}</span></div>
    <div class="cv-contact-item"><span class="cv-icon">🔗</span><span>{{social_url_linkedin}}</span></div>

    <div class="cv-divider"></div>

    <div class="cv-section-label">HỌC VẤN</div>
    {{#each education}}
    <div class="cv-edu-item">
      <div class="cv-edu-school">{{school}}</div>
      <div class="cv-edu-field">{{field}}</div>
      <div class="cv-edu-year">{{startYear}} – {{endYear}}</div>
      {{#if GPA}}<div class="cv-edu-gpa">GPA: {{GPA}}</div>{{/if}}
    </div>
    {{/each}}

    <div class="cv-divider"></div>

    <div class="cv-section-label">BẰNG CẤP & NGÔN NGỮ</div>
    <div class="cv-misc">{{degree}}</div>
    <div class="cv-misc">{{languages}}</div>
  </div>

  <div class="cv-right">
    <div class="cv-section">
      <div class="cv-section-title">MỤC TIÊU NGHỀ NGHIỆP</div>
      <p class="cv-summary">{{summary}}</p>
    </div>

    <div class="cv-section">
      <div class="cv-section-title">KINH NGHIỆM LÀM VIỆC</div>
      {{#each experience}}
      <div class="cv-entry">
        <div class="cv-entry-dot"></div>
        <div class="cv-entry-body">
          <div class="cv-entry-header">
            <div>
              <div class="cv-entry-company">{{company}}</div>
              <div class="cv-entry-pos">{{position}}</div>
            </div>
            <div class="cv-entry-date">{{startYear}} – {{endYear}}</div>
          </div>
          <p class="cv-entry-desc">{{description}}</p>
        </div>
      </div>
      {{/each}}
    </div>

    <div class="cv-section">
      <div class="cv-section-title">DỰ ÁN NỔI BẬT</div>
      {{#each projects}}
      <div class="cv-project">
        <div class="cv-project-header">
          <span class="cv-project-name">{{name}}</span>
          {{#if link}}<a class="cv-project-link" href="{{link}}">{{link}}</a>{{/if}}
        </div>
        <div class="cv-project-pos">{{position}}</div>
        <p class="cv-project-desc">{{description}}</p>
      </div>
      {{/each}}
    </div>
  </div>
</div>
`;

const TEMPLATE_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
.cv-wrap {
  display: flex;
  width: 794px;
  min-height: 1123px;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 13px;
  color: #2d2d2d;
  background: #fff;
}
.cv-left {
  width: 240px;
  flex-shrink: 0;
  background: #00593a;
  padding: 32px 20px;
}
.cv-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  border: 3px solid rgba(255,255,255,0.35);
  overflow: hidden;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cv-avatar img { width: 100%; height: 100%; object-fit: cover; }
.cv-name { color: #fff; font-size: 18px; font-weight: 700; text-align: center; }
.cv-job { color: #a8e6c8; font-size: 12px; text-align: center; margin-top: 4px; letter-spacing: 0.5px; }
.cv-divider { height: 1px; background: rgba(255,255,255,0.15); margin: 18px 0; }
.cv-section-label { color: #a8e6c8; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; margin-bottom: 12px; }
.cv-contact-item { display: flex; gap: 8px; color: rgba(255,255,255,0.85); font-size: 12px; margin-bottom: 8px; line-height: 1.4; word-break: break-all; }
.cv-icon { flex-shrink: 0; font-size: 12px; }
.cv-edu-item { margin-bottom: 12px; }
.cv-edu-school { color: #fff; font-size: 12px; font-weight: 600; }
.cv-edu-field  { color: rgba(255,255,255,0.75); font-size: 11px; margin-top: 2px; }
.cv-edu-year   { color: rgba(255,255,255,0.55); font-size: 11px; margin-top: 1px; }
.cv-edu-gpa    { color: #a8e6c8; font-size: 11px; margin-top: 1px; }
.cv-misc { color: rgba(255,255,255,0.8); font-size: 12px; margin-bottom: 6px; }
.cv-right { flex: 1; padding: 32px 28px; }
.cv-section { margin-bottom: 22px; }
.cv-section-title { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #00593a; border-bottom: 2px solid #00b14f; padding-bottom: 6px; margin-bottom: 14px; }
.cv-summary { color: #555; line-height: 1.75; font-size: 12.5px; }
.cv-entry { display: flex; gap: 12px; margin-bottom: 16px; }
.cv-entry-dot { width: 8px; height: 8px; border-radius: 50%; background: #00b14f; flex-shrink: 0; margin-top: 5px; }
.cv-entry-body { flex: 1; }
.cv-entry-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
.cv-entry-company { font-size: 13px; font-weight: 700; color: #1a1a1a; }
.cv-entry-pos     { font-size: 12px; color: #00593a; font-weight: 600; margin-top: 2px; }
.cv-entry-date    { font-size: 11px; color: #999; white-space: nowrap; flex-shrink: 0; }
.cv-entry-desc    { font-size: 12px; color: #555; line-height: 1.6; }
.cv-project { margin-bottom: 14px; }
.cv-project-header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 3px; }
.cv-project-name   { font-size: 13px; font-weight: 700; color: #1a1a1a; }
.cv-project-link   { font-size: 11px; color: #00963e; text-decoration: none; }
.cv-project-pos    { font-size: 12px; color: #00593a; font-weight: 600; margin-bottom: 4px; }
.cv-project-desc   { font-size: 12px; color: #555; line-height: 1.6; }
`;

async function main() {
    console.log("⏳ Đang tiến hành kết nối cơ sở dữ liệu và seed dữ liệu...");

    // Khớp chính xác Enum 'PROFESSIONAL' thuộc loại 'TemplateCategory' từ Schema của bạn
    const template = await prisma.resumeTemplate.upsert({
        where: { slug: "chuyen-nghiep-xanh-v2" },
        update: {
            htmlContent: TEMPLATE_HTML,
            cssContent: TEMPLATE_CSS,
        },
        create: {
            name: "Chuyên Nghiệp Xanh",
            slug: "chuyen-nghiep-xanh-v2",
            description: "Template 2 cột chuyên nghiệp, cột trái xanh đậm với thông tin liên hệ và học vấn, cột phải trình bày kinh nghiệm và dự án.",
            category: "PROFESSIONAL",
            isActive: true,
            htmlContent: TEMPLATE_HTML,
            cssContent: TEMPLATE_CSS,
        },
    });

    console.log("✅ Seed thành công! Dữ liệu mẫu đã được ghi nhận.");
    console.log("Thông tin mẫu ID:", template.id);
}

main()
    .catch((error) => {
        console.error("❌ Gặp lỗi trong quá trình thực thi seed mẫu:", error);
        process.exit(1);
    })
    .finally(async () => {
        // Ngắt kết nối an toàn sau khi kết thúc luồng
        await prisma.$disconnect();
    });