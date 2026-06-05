export interface EducationItem {
  school: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  description: string;
  GPA: string;
}

export interface ExperienceItem {
  company: string;
  position: string;
  startYear: string;
  endYear: string;
  description: string;
}

export interface ResumeRenderData {
  name: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  summary: string;
  education: EducationItem[];
  experience: ExperienceItem[];
}

const DEMO_DEFAULTS = {
  name: 'NGUYỄN VĂN A',
  title: 'Vị trí ứng tuyển',
  email: 'candidate@example.com',
  phone: '0912 345 678',
  address: 'Dương Đông, Phú Quốc',
  summary: 'Nhập mục tiêu nghề nghiệp...',
};

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function val(value: string, fallback: string, live: boolean): string {
  if (value.trim()) return escHtml(value);
  return live ? '' : escHtml(fallback);
}

function renderEducationItems(education: EducationItem[], live: boolean): string {
  const items = education.filter(e => e.school || e.degree || e.field);
  if (items.length === 0) return live ? '' : '<p class="text-sm text-gray-400">Chưa có thông tin học vấn</p>';
  return items
    .map(
      edu => `
    <div class="cv-edu-item" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-weight:600">
        <span>${escHtml(edu.school || 'Trường học')} — ${escHtml(edu.degree || '')}</span>
        <span style="font-size:13px;color:#666">${escHtml(edu.startYear || '')}${edu.startYear || edu.endYear ? ' - ' : ''}${escHtml(edu.endYear || 'Hiện tại')}</span>
      </div>
      ${edu.field ? `<p style="font-size:14px;color:#555;margin:4px 0">${escHtml(edu.field)}${edu.GPA ? ` (GPA: ${escHtml(edu.GPA)})` : ''}</p>` : ''}
      ${edu.description ? `<p style="font-size:13px;color:#777;margin:0">${escHtml(edu.description)}</p>` : ''}
    </div>
  `,
    )
    .join('');
}

function renderExperienceItems(experience: ExperienceItem[], live: boolean): string {
  const items = experience.filter(e => e.company || e.position);
  if (items.length === 0) return live ? '' : '<p class="text-sm text-gray-400">Chưa có kinh nghiệm</p>';
  return items
    .map(
      exp => `
    <div class="cv-exp-item" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-weight:600">
        <span>${escHtml(exp.company || 'Công ty')} — ${escHtml(exp.position || '')}</span>
        <span style="font-size:13px;color:#666">${escHtml(exp.startYear || '')}${exp.startYear || exp.endYear ? ' - ' : ''}${escHtml(exp.endYear || 'Hiện tại')}</span>
      </div>
      ${exp.description ? `<p style="font-size:13px;color:#555;margin:6px 0 0;white-space:pre-line">${escHtml(exp.description)}</p>` : ''}
    </div>
  `,
    )
    .join('');
}

export function renderTemplateHtml(
  htmlContent: string,
  data: ResumeRenderData,
  options: { live?: boolean } = {},
): string {
  const live = options.live ?? false;
  let html = htmlContent;

  html = html.replace(/\{\{#each education\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, block) =>
    data.education
      .map(edu => {
        let item = block;
        item = item.replace(/\{\{school\}\}/g, val(edu.school, 'Trường học', live));
        item = item.replace(/\{\{degree\}\}/g, val(edu.degree, 'Bằng cấp', live));
        item = item.replace(/\{\{field\}\}/g, val(edu.field, '', live));
        item = item.replace(/\{\{startYear\}\}/g, val(edu.startYear, '', live));
        item = item.replace(/\{\{endYear\}\}/g, edu.endYear ? escHtml(edu.endYear) : live ? '' : 'Hiện tại');
        item = item.replace(/\{\{description\}\}/g, val(edu.description, '', live));
        item = item.replace(/\{\{GPA\}\}/g, val(edu.GPA, '', live));
        item = item.replace(/\{\{#if GPA\}\}([\s\S]*?)\{\{\/if\}\}/g, edu.GPA ? '$1' : '');
        return item;
      })
      .join(''),
  );

  html = html.replace(/\{\{#each experience\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, block) =>
    data.experience
      .map(exp => {
        let item = block;
        item = item.replace(/\{\{company\}\}/g, val(exp.company, 'Công ty', live));
        item = item.replace(/\{\{position\}\}/g, val(exp.position, 'Chức vụ', live));
        item = item.replace(/\{\{startYear\}\}/g, val(exp.startYear, '', live));
        item = item.replace(/\{\{endYear\}\}/g, exp.endYear ? escHtml(exp.endYear) : live ? '' : 'Hiện tại');
        item = item.replace(/\{\{description\}\}/g, val(exp.description, '', live));
        return item;
      })
      .join(''),
  );

  html = html.replace(/\{\{education\}\}/g, renderEducationItems(data.education, live));
  html = html.replace(/\{\{experience\}\}/g, renderExperienceItems(data.experience, live));

  const scalar: Record<string, string> = {
    name: val(data.name, DEMO_DEFAULTS.name, live),
    title: val(data.title, DEMO_DEFAULTS.title, live),
    email: val(data.email, DEMO_DEFAULTS.email, live),
    phone: val(data.phone, DEMO_DEFAULTS.phone, live),
    address: val(data.address, DEMO_DEFAULTS.address, live),
    summary: val(data.summary, DEMO_DEFAULTS.summary, live),
    fullname: val(data.name, DEMO_DEFAULTS.name, live),
    job_title: val(data.title, DEMO_DEFAULTS.title, live),
    objective: val(data.summary, DEMO_DEFAULTS.summary, live),
  };

  for (const [key, value] of Object.entries(scalar)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  return html;
}

export function buildPreviewDocument(html: string, css: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; background: #fff; }
    ${css}
  </style>
</head>
<body>${html}</body>
</html>`;
}

export function parseResumeJson<T>(json: unknown): T[] {
  if (!json) return [];
  if (Array.isArray(json)) return json as T[];
  return [];
}

/** CV dạng HTML đơn giản khi không có template */
export function renderResumeFallback(data: ResumeRenderData): string {
  return `
    <div style="font-family:Segoe UI,sans-serif;max-width:800px;margin:0 auto;color:#333">
      <h1 style="font-size:28px;margin:0 0 4px;color:#041b3c">${escHtml(data.name)}</h1>
      <p style="color:#0052CC;font-weight:600;margin:0 0 8px">${escHtml(data.title)}</p>
      <p style="font-size:14px;color:#666;margin:0 0 20px">
        ${escHtml(data.email)} · ${escHtml(data.phone)} · ${escHtml(data.address)}
      </p>
      ${data.summary ? `<section style="margin-bottom:20px"><h2 style="font-size:16px;border-bottom:2px solid #0052CC;padding-bottom:4px">Mục tiêu</h2><p style="line-height:1.6">${escHtml(data.summary)}</p></section>` : ''}
      <section style="margin-bottom:20px"><h2 style="font-size:16px;border-bottom:2px solid #0052CC;padding-bottom:4px">Học vấn</h2>${renderEducationItems(data.education, true)}</section>
      <section><h2 style="font-size:16px;border-bottom:2px solid #0052CC;padding-bottom:4px">Kinh nghiệm</h2>${renderExperienceItems(data.experience, true)}</section>
    </div>
  `;
}

export function buildResumePreview(
  data: ResumeRenderData,
  template?: { htmlContent: string; cssContent: string } | null,
): string {
  const html = template?.htmlContent
    ? renderTemplateHtml(template.htmlContent, data, { live: true })
    : renderResumeFallback(data);
  const css = template?.cssContent ?? '';
  return buildPreviewDocument(html, css);
}
