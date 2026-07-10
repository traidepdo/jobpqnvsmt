import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { Job, Pagination } from "@/lib/types/employer/job";

export async function getJobs(employerId: string, status?: string, isVisible?: string, page: number = 1, limit: number = 10, search?: string, category?: string) {
    const skip = (page - 1) * limit;
    const where = {
        company: {
            ownerId: employerId,
        },
        ...(status === 'ACTIVE' && {
            status: 'ACTIVE' as JobStatus,
            OR: [
                { deadline: null },
                { deadline: { gte: new Date() } }
            ]
        }),
        ...(status === 'EXPIRED' && {
            status: 'ACTIVE' as JobStatus,
            deadline: { lt: new Date() }
        }),
        ...(status === 'CLOSED' && {
            status: 'CLOSED' as JobStatus
        }),
        ...(status && status !== 'ACTIVE' && status !== 'EXPIRED' && status !== 'CLOSED' && { status: status as JobStatus }),
        ...(isVisible === 'true' && { isVisible: true }),
        ...(isVisible === 'false' && { isVisible: false }),
        ...(search?.trim() && {
            OR: [
                { title: { contains: search.trim(), mode: 'insensitive' as const } },
            ],
        }),
        ...(category?.trim() && {
            category: {
                slug: { equals: category.trim(), mode: 'insensitive' as const }
            }
        }),

    };
    const [jobsData, total] = await Promise.all([
        prisma.job.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                category: { select: { name: true } },
                ward: { select: { name: true } },
                _count: { select: { applications: true } },
            },
        }),
        prisma.job.count({ where }),
    ]);
    const jobs: Job[] = jobsData.map((job) => {
        return {
            id: job.id,
            title: job.title,
            slug: job.slug,
            status: job.status,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            deadline: job.deadline ? job.deadline.toISOString() : null,
            category: {
                name: job.category?.name || "",
            },
            ward: job.ward ? {
                name: job.ward.name,
            } : null,
            _count: {
                applications: job._count?.applications || 0,
            },
            isVisible: job.isVisible,
            rejectReason: job.rejectReason || "",
        };
    });

    return { jobs, pagination: { page: page, limit: limit, total: total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } as Pagination };
}


export async function getCategories() {
    const categories = await prisma.category.findMany();
    return categories.map((category) => {
        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
        };
    });
}
