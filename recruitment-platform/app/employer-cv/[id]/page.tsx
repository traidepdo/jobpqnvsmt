import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TEMPLATE_MAP } from "@/template/index";
import React from "react";


export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resume = await prisma.resume.findUnique({
    where: { id },
    select: { cvData: true, fullName: true, user: { select: { name: true } } }
  });
  if (!resume) return {};
  const name = (resume.cvData as any)?.name || resume.fullName || resume.user.name || 'Hồ sơ';
  return {
    title: `CV - ${name} (Employer View)`,
  };
}

export default async function EmployerCvPage({
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

  const user = {
    name: (resume.cvData as any)?.name || resume.fullName || resume.user.name || '',
    email: (resume.cvData as any)?.email || resume.user.email || '',
    phone: (resume.cvData as any)?.phone || resume.user.phone || '',
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
    <div className="bg-white min-h-screen pt-15 print:pt-0">

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{
        __html: `
        body {
          font-family: 'Inter', sans-serif;
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
        button,
        label.cursor-pointer,
        .print\\:hidden,
        [class*="print:hidden"],
        .cv-viewer-container > div > div.print\\:hidden {
          display: none !important;
        }
      `}} />
      <div className="cv-viewer-container">
        <TemplateComponent user={user} resume={resumeData} />
      </div>


    </div>
  );
}
