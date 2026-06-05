// app/api/resumes/[id]/render/route.ts
// GET /api/resumes/:id/render — trả về HTML string đã render

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderTemplate, ResumeData } from "@/lib/template-engine";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const resume = await prisma.resume.findUnique({
            where: { id },
            include: {
                user: { select: { name: true, email: true, phone: true, avatar: true } },
                template: { select: { htmlContent: true, cssContent: true } },
            },
        });

        if (!resume) {
            return NextResponse.json({ error: "Không tìm thấy resume" }, { status: 404 });
        }

        if (!resume.template) {
            return NextResponse.json({ error: "Resume này chưa chọn template" }, { status: 400 });
        }

        const data: ResumeData = {
            name: resume.user.name,
            email: resume.user.email,
            phone: resume.user.phone || "",
            avatar: resume.user.avatar || "",
            address: resume.address || "",
            summary: resume.summary || "",
            degree: resume.degree || "",
            languages: resume.languages || "",
            socialLinks: (resume.socialLinks as ResumeData["socialLinks"]) || [],
            education: (resume.education as ResumeData["education"]) || [],
            experience: (resume.experience as ResumeData["experience"]) || [],
            projects: (resume.projects as ResumeData["projects"]) || [],
        };

        const html = renderTemplate(
            resume.template.htmlContent,
            resume.template.cssContent,
            data
        );

        return new NextResponse(html, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
    }
}