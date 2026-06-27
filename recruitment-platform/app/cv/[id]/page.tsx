import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TEMPLATE_MAP } from "@/template/index";
import React from "react";

export default async function CvPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const resume = await prisma.resume.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true, avatar: true } },
      template: { select: { slug: true } },
    },
  });

  if (!resume) {
    notFound();
  }

  const slug = resume.template?.slug || "classic";
  const TemplateComponent = (TEMPLATE_MAP as any)[slug];

  if (!TemplateComponent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow border border-gray-100 text-center max-w-md">
          <p className="text-red-500 font-bold text-lg mb-2">Không tìm thấy mẫu thiết kế</p>
          <p className="text-gray-500 text-sm">Mẫu CV này không hợp lệ hoặc chưa được đăng ký.</p>
        </div>
      </div>
    );
  }

  const cvData = resume.cvData as any;
  const user = {
    name: cvData?.name || resume.user.name || '',
    email: cvData?.email || resume.user.email || '',
    phone: cvData?.phone || resume.user.phone || '',
    avatar: resume.avatarUrl || resume.user.avatar || 'https://i.pravatar.cc/150?img=12',
  };

  const resumeData = {
    address: resume.address || '',
    summary: resume.summary || '',
    degree: resume.degree || '',
    languages: resume.languages || '',
    socicallink: (resume.socialLinks as any) || [],
    education: resume.education || [],
    experience: resume.experience || [],
    projects: resume.projects || [],
  };

  return (
    <div className="bg-gray-100 min-h-screen pt-15 print:pt-0">
      <title>{`CV - ${user.name || 'Hồ sơ'}`}</title>
      <script src="https://cdn.tailwindcss.com" async></script>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{
        __html: `
        body {
          font-family: 'Inter', sans-serif;
        }
        @media print {
          @page {
            margin: 12mm 15mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        .print\\:hidden,
        button[class*="print:hidden"],
        label[class*="print:hidden"],
        span[class*="print:hidden"] {
          display: none !important;
        }
        input, textarea {
          pointer-events: none !important;
          cursor: default !important;
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          resize: none !important;
        }
      `}} />
      <TemplateComponent user={user} resume={resumeData} />

      {/* Floating Print Button (Hidden when printing) */}
      <div className="fixed bottom-6 right-6 flex items-center gap-2 print:hidden z-50">
        <button
          id="print-btn"
          className="flex items-center gap-2 bg-[#00b14f] hover:bg-[#009940] text-white font-bold px-5 py-3 rounded-full shadow-lg transition transform hover:scale-105 active:scale-95 text-sm cursor-pointer border-none"
        >
          <span className="material-symbols-outlined text-lg">print</span>
          Tải xuống / In PDF
        </button>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
        window.addEventListener("load", () => {
          const printBtn = document.getElementById('print-btn');
          if (printBtn) {
            printBtn.addEventListener('click', () => {
              window.print();
            });
          }
          
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('print') === 'true') {
            setTimeout(() => {
              window.print();
            }, 300);
          }
        });
      `}} />
    </div>
  );
}
