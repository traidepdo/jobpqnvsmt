import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(req: NextRequest) {
    try {
        const result = await requireAdmin();
        if ("error" in result) return result.error;
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const skip = (page - 1) * limit;
        const where = search
            ? {
                OR: [
                    { name: { contains: search } },
                    { slug: { contains: search } },
                ],
            }
            : {};

        const [categories, total] = await Promise.all([
            prisma.category.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    icon: true,
                    slug: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma.category.count({ where }),
        ]);
        return NextResponse.json({
            data: categories,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
    }
}


export async function POST(req: NextRequest) {
    try {
        const result = await requireAdmin();
        if ("error" in result) return result.error;
        const body = await req.json();
        const { name, icon, slug } = body;
        if (!name || !icon || !slug) {
            return NextResponse.json({ error: "Thiếu các trường bắt buộc: name, icon, slug" }, { status: 400 });
        }
        const existing = await prisma.category.findUnique({ where: { slug } });
        if (existing) {
            return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
        }
        const category = await prisma.category.create({
            data: { name, icon, slug },
        });
        return NextResponse.json({ data: category }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
    }
}