// app/api/resumes/[id]/render/route.ts
// GET /api/resumes/:id/render — trả về HTML string đã render

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderReactTemplate } from "@/lib/renderResumeServer";

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
                template: { select: { slug: true } },
            },
        });

        if (!resume) {
            return NextResponse.json({ error: "Không tìm thấy resume" }, { status: 404 });
        }

        const slug = resume.template?.slug || "classic";

        const html = renderReactTemplate(
            slug,
            {
                name: resume.user.name,
                email: resume.user.email,
                phone: resume.user.phone || "",
                avatar: resume.avatarUrl || resume.user.avatar || "",
            },
            resume
        );

        return new NextResponse(html, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
    }
}