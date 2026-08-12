import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const [categories, wards] = await Promise.all([
            prisma.category.findMany({
                orderBy: { name: "asc" },
                select: { id: true, name: true, slug: true },
            }),
            prisma.ward.findMany({
                orderBy: { name: "asc" },
                select: { id: true, name: true, district: { select: { name: true } } },
            }),
        ]);

        return NextResponse.json({ categories, wards });
    } catch (error) {
        return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
    }
}
