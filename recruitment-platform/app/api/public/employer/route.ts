import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { companyCardSelect } from "@/lib/prismaSafe";

export async function GET() {
    try {
        const countJobCompany = await prisma.job.groupBy({
            by: ['companyId'],
            _count: {
                id: true,
            },
            where: {
                status: 'ACTIVE',
                company: {
                    isApproved: true,
                    isActive: true,
                },
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
            take: 10,
        });

        const companyIds = countJobCompany.map(item => item.companyId);
        const companies = await prisma.company.findMany({
            where: {
                id: { in: companyIds },
            },
            select: companyCardSelect,
        });
        const sortCompany = companyIds.map((id) => companies.find((company) => company.id === id)).filter(Boolean);

        return NextResponse.json({ companies: sortCompany });
    } catch (error) {
        console.error("Error in employer route:", error);
        return NextResponse.json(
            { error: "Internal Server Error", companies: [] },
            { status: 500 }
        );
    }
}