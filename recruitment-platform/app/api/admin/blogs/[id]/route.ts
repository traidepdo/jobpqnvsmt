// app/api/admin/blogs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const post = await prisma.blog.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } },
            },
        });
        if (!post) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
        return NextResponse.json({ ok: true, post });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireAdmin();
        if (auth.error) return auth.error;

        const { id } = await params;
        const { title, slug, excerpt, content, thumbnail, isPublished, categoryId, type } = await req.json();

        if (!title?.trim()) return NextResponse.json({ error: 'Tiêu đề là bắt buộc' }, { status: 400 });
        if (!slug?.trim()) return NextResponse.json({ error: 'Slug là bắt buộc' }, { status: 400 });

        // Validate thumbnail URL hợp lệ (nếu có)
        if (thumbnail?.trim()) {
            try {
                new URL(thumbnail);
            } catch {
                return NextResponse.json({ error: 'URL thumbnail không hợp lệ' }, { status: 400 });
            }
        }

        const slugConflict = await prisma.blog.findFirst({ where: { slug, NOT: { id } } });
        if (slugConflict) return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 409 });

        const post = await prisma.blog.update({
            where: { id },
            data: {
                title: title.trim(),
                slug: slug.trim(),
                excerpt: excerpt?.trim() || null,
                content: content || '',
                thumbnail: thumbnail?.trim() || null,
                isPublished: isPublished ?? false,
                categoryId: categoryId || null,
                type: type || 'RICH_TEXT',
            },
        });

        return NextResponse.json({ ok: true, post });
    } catch (e: any) {
        if (e?.code === 'P2025') return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
        console.error(e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireAdmin();
        if (auth.error) return auth.error;

        const { id } = await params;
        // Xóa tất cả các tag liên kết trước để tránh lỗi khóa ngoại (Foreign Key Constraint)
        await prisma.blogTag.deleteMany({ where: { blogId: id } });
        
        await prisma.blog.delete({ where: { id } });
        return NextResponse.json({ ok: true, message: 'Đã xóa bài viết' });
    } catch (e: any) {
        if (e?.code === 'P2025') return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
        console.error(e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}