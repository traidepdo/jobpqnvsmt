import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const result = await requireAdmin();
    if ('error' in result) return result.error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(50, Number(searchParams.get('limit')) || 10);
    const search = searchParams.get('search') || '';
    const experience = searchParams.get('experience') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    where.status = "PENDING";

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }

    if (experience) where.experience = experience;
    if (categoryId) where.categoryId = categoryId;

    const [jobs, total] = await Promise.all([
        prisma.job.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                company: { select: { id: true, name: true, slug: true, logo: true, size: true, description: true, website: true, } },
                category: { select: { id: true, name: true } },
            },
        }),
        prisma.job.count({ where }),
    ]);

    return NextResponse.json({
        jobs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    });
}