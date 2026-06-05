// app/api/admin/dashboard/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET() {
    const result = await requireAdmin();
    if ('error' in result) return result.error;

    const [
        totalUsers,
        totalCompanies,
        totalJobs,
        totalApplications,
        pendingCompanies,
        pendingJobs,
        pendingJobsCount,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.company.count(),
        prisma.job.count(),
        prisma.application.count(),
        prisma.company.findMany({
            where: { isApproved: false, isActive: true },
            select: { id: true, name: true, industry: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
        }),
        prisma.job.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
                company: { select: { name: true } },
            },
        }),
        prisma.job.count({ where: { status: 'PENDING' } }),
    ]);

    return NextResponse.json({
        summary: { totalUsers, totalCompanies, totalJobs, totalApplications },
        pendingCompanies,
        pendingJobs,
        pendingJobsCount,
    });
}