// app/api/admin/blog-categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

interface RouteParams { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireAdmin();
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

        const { id } = await params;
        const { name, slug } = await req.json();
        if (!name?.trim()) return NextResponse.json({ error: 'Tên là bắt buộc' }, { status: 400 });
        if (!slug?.trim()) return NextResponse.json({ error: 'Slug là bắt buộc' }, { status: 400 });

        const slugConflict = await prisma.blogCategory.findFirst({ where: { slug, NOT: { id } } });
        if (slugConflict) return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 409 });

        const category = await prisma.blogCategory.update({
            where: { id },
            data: { name: name.trim(), slug: slug.trim() },
        });
        return NextResponse.json({ ok: true, category });
    } catch (e: any) {
        if (e?.code === 'P2025') return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireAdmin();
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

        const { id } = await params;

        // Kiểm tra còn bài viết không
        const count = await prisma.blog.count({ where: { categoryId: id } });
        if (count > 0) {
            return NextResponse.json(
                { error: `Không thể xóa, còn ${count} bài viết thuộc danh mục này` },
                { status: 409 }
            );
        }

        await prisma.blogCategory.delete({ where: { id } });
        return NextResponse.json({ ok: true, message: 'Đã xóa danh mục' });
    } catch (e: any) {
        if (e?.code === 'P2025') return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}