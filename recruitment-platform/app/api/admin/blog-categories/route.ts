// app/api/admin/blog-categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(req: NextRequest) {
    try {
        const withCount = new URL(req.url).searchParams.get('withCount') === 'true';
        const categories = await prisma.blogCategory.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                createdAt: true,
                ...(withCount ? { _count: { select: { blogs: true } } } : {}),
            },
        });
        return NextResponse.json({ ok: true, categories });
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAdmin();
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

        const { name, slug } = await req.json();
        if (!name?.trim()) return NextResponse.json({ error: 'Tên là bắt buộc' }, { status: 400 });
        if (!slug?.trim()) return NextResponse.json({ error: 'Slug là bắt buộc' }, { status: 400 });

        const category = await prisma.blogCategory.create({
            data: { name: name.trim(), slug: slug.trim() },
        });
        return NextResponse.json({ ok: true, category }, { status: 201 });
    } catch (e: any) {
        if (e?.code === 'P2002') return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 409 });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}