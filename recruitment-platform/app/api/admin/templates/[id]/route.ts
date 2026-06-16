// app/api/admin/templates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Lấy 1 template đầy đủ (có htmlContent + cssContent)
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const template = await prisma.resumeTemplate.findUnique({ where: { id } });
        if (!template) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
        return NextResponse.json({ ok: true, template });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Cập nhật template
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireAdmin();
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

        const { id } = await params;
        const { name, slug, description, category, htmlContent, cssContent, thumbnailUrl } = await req.json();

        if (!name?.trim() || !slug?.trim()) {
            return NextResponse.json({ error: 'Tên và slug là bắt buộc' }, { status: 400 });
        }

        // Kiểm tra slug trùng với template khác
        const existing = await prisma.resumeTemplate.findFirst({
            where: { slug, NOT: { id } }
        });
        if (existing) return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 409 });

        const template = await prisma.resumeTemplate.update({
            where: { id },
            data: {
                name: name.trim(),
                slug: slug.trim(),
                description: description?.trim() || null,
                category: category || 'Cơ bản',
                htmlContent: htmlContent || '',
                cssContent: cssContent || '',
                thumbnailUrl: thumbnailUrl || null,
            }
        });

        return NextResponse.json({ ok: true, template });
    } catch (error: any) {
        if (error?.code === 'P2025') return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Xóa template
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireAdmin();
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

        const { id } = await params;
        await prisma.resumeTemplate.delete({ where: { id } });
        return NextResponse.json({ ok: true, message: 'Đã xóa template' });
    } catch (error: any) {
        if (error?.code === 'P2025') return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}