import React from 'react';
import { buildPreviewDocument, renderResumeFallback } from '@/lib/renderResume';

export function renderReactTemplate(
  slug: string,
  user: any,
  resume: any
): string {
  // Use dynamic require to prevent Next.js from complaining about client components importing react-dom/server
  const { renderToStaticMarkup } = require('react-dom/server');
  const { TEMPLATE_MAP } = require('@/template/index');

  const TemplateComponent = (TEMPLATE_MAP as any)[slug];
  if (!TemplateComponent) {
    return '';
  }

  // Render the React component to HTML string
  const contentHtml = renderToStaticMarkup(
    React.createElement(TemplateComponent, {
      user: {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || user.avatarUrl || 'https://i.pravatar.cc/150?img=12',
      },
      resume: {
        address: resume.address || '',
        summary: resume.summary || '',
        degree: resume.degree || '',
        languages: resume.languages || '',
        socicallink: resume.socicallink || resume.socialLinks || [],
        education: resume.education || [],
        experience: resume.experience || [],
        projects: resume.projects || [],
      }
    })
  );

  // Wrap with a full HTML document including Tailwind CSS CDN, custom read-only styles and script
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CV - ${user.name || 'Hồ sơ'}</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts: Inter & Material Symbols Outlined -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" />
  <style>
    body {
      font-family: 'Inter', sans-serif;
    }
    /* Hide all editor panels, add/delete buttons */
    .print\\:hidden,
    button[class*="print:hidden"],
    label[class*="print:hidden"],
    span[class*="print:hidden"] {
      display: none !important;
    }
    /* Make inputs look like plain text */
    input, textarea {
      pointer-events: none !important;
      cursor: default !important;
      background: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      resize: none !important;
    }
  </style>
</head>
<body class="bg-gray-100">
  ${contentHtml}

  <!-- Floating Print Button (Hidden when printing) -->
  <div class="fixed bottom-6 right-6 flex items-center gap-2 print:hidden z-50">
    <button onclick="window.print()" class="flex items-center gap-2 bg-[#00b14f] hover:bg-[#009940] text-white font-bold px-5 py-3 rounded-full shadow-lg transition transform hover:scale-105 active:scale-95 text-sm cursor-pointer">
      <span class="material-symbols-outlined text-lg">print</span>
      Tải xuống / In PDF
    </button>
  </div>

  <script>
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll("input, textarea").forEach(el => {
        el.disabled = true;
        el.readOnly = true;
      });
    });
  </script>
</body>
</html>`;
}

export function buildReactResumePreview(
  slug: string | null,
  user: any,
  resume: any
): string {
  const { TEMPLATE_MAP } = require('@/template/index');
  if (slug && (TEMPLATE_MAP as any)[slug]) {
    return renderReactTemplate(slug, user, resume);
  }
  // Fallback to basic HTML rendering
  const data = {
    name: user.name || '',
    title: resume.degree || '',
    email: user.email || '',
    phone: user.phone || '',
    address: resume.address || '',
    summary: resume.summary || '',
    education: resume.education || [],
    experience: resume.experience || [],
  };
  return buildPreviewDocument(renderResumeFallback(data), '');
}
