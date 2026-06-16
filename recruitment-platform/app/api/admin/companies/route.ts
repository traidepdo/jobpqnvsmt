// app/api/admin/companies/route.ts
import { requireAdmin } from "@/lib/requireAdmin";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const result = await requireAdmin();
        if ("error" in result) return result.error;

        const companies = await prisma.company.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                website: true,
                industry: true,
                size: true,
                description: true,
                addressDetail: true,
                isApproved: true,
                isActive: true,
                createdAt: true,
                owner: {
                    select: { id: true, name: true, email: true, phone: true }
                },
                _count: {
                    select: { jobs: true }
                },
            },
        });

        return NextResponse.json({ companies });
    } catch (error) {
        console.error("Error fetching companies:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}