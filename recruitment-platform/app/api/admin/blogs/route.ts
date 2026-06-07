// app/api/admin/blogs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'));
        const search = searchParams.get('search') || '';
        const isPublished = searchParams.get('isPublished') || '';
        const categoryId = searchParams.get('categoryId') || '';

        const where: any = {};
        if (search) where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { excerpt: { contains: search, mode: 'insensitive' } },
        ];
        if (isPublished !== '') where.isPublished = isPublished === 'true';
        if (categoryId) where.categoryId = categoryId;

        const [posts, total] = await Promise.all([
            prisma.blog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true, title: true, slug: true, excerpt: true,
                    thumbnail: true, isPublished: true, views: true,
                    createdAt: true, updatedAt: true,
                    author: { select: { id: true, name: true } },
                    category: { select: { id: true, name: true } },
                    _count: { select: { tags: true } },
                },
            }),
            prisma.blog.count({ where }),
        ]);

        return NextResponse.json({
            ok: true, posts,
            pagination: {
                page, limit, total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAdmin();
        if (auth.error) return auth.error;

        const { title, slug, excerpt, content, thumbnail, isPublished, categoryId, type } = await req.json();

        if (!title?.trim()) return NextResponse.json({ error: 'Tiêu đề là bắt buộc' }, { status: 400 });
        if (!slug?.trim()) return NextResponse.json({ error: 'Slug là bắt buộc' }, { status: 400 });

        // Validate thumbnail phải là Cloudinary URL hoặc URL hợp lệ (nếu có)
        if (thumbnail && thumbnail.trim()) {
            try {
                new URL(thumbnail); // kiểm tra URL hợp lệ
            } catch {
                return NextResponse.json({ error: 'URL thumbnail không hợp lệ' }, { status: 400 });
            }
        }

        const existing = await prisma.blog.findUnique({ where: { slug } });
        if (existing) return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 409 });

        const post = await prisma.blog.create({
            data: {
                title: title.trim(),
                slug: slug.trim(),
                excerpt: excerpt?.trim() || null,
                content: content || '',
                // Lưu URL Cloudinary (hoặc URL thủ công), null nếu trống
                thumbnail: thumbnail?.trim() || null,
                isPublished: isPublished ?? false,
                type: type || 'RICH_TEXT',
                authorId: auth.payload.id,
                categoryId: categoryId || null,
            },
        });

        return NextResponse.json({ ok: true, post }, { status: 201 });
    } catch (e: any) {
        if (e?.code === 'P2002') return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 409 });
        console.error(e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}   