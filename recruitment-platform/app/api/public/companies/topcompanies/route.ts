import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { companyCardSelect } from "@/lib/prismaSafe";
export async function GET(req: NextRequest) {

    const topJobcompanies = await prisma.job.groupBy({
        by: ["companyId"],
        _count: {
            id: true
        },
        where: {
            status: "ACTIVE",

        },
        orderBy: {
            _count: {
                id: "desc"
            }
        },
        take: 10
    })

    const topcompanyIds = topJobcompanies.map((job) => job.companyId);
    const companies = await prisma.company.findMany({
        where: {
            id: { in: topcompanyIds },
            isApproved: true,
            isActive: true,
        },
        select: companyCardSelect,
    });

    const companyCountsMap = new Map(topJobcompanies.map(item => [item.companyId, item._count.id]));

    const sortedCompanies = companies
        .map(comp => ({
            ...comp,
            _count: {
                jobs: companyCountsMap.get(comp.id) || 0
            }
        }))
        .sort((a, b) => b._count.jobs - a._count.jobs);

    return NextResponse.json({ companies: sortedCompanies })
}   