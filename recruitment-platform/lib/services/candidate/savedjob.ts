import { prisma } from "@/lib/prisma";
import { SavedItem } from "@/lib/types/candidate/SavedJob";
export async function createSavedJob(
    id: string, 
    { page = 1, limit = 12, query }: { page?: number; limit?: number; query?: string } = {}
) {
    const whereCondition: any = {
        userId: id,
    };

    if (query && query.trim()) {
        const normalizedQuery = query.trim();
        whereCondition.job = {
            OR: [
                {
                    title: {
                        contains: normalizedQuery,
                        mode: 'insensitive',
                    },
                },
                {
                    company: {
                        name: {
                            contains: normalizedQuery,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    category: {
                        name: {
                            contains: normalizedQuery,
                            mode: 'insensitive',
                        },
                    },
                },
            ],
        };
    }

    const [data, total] = await Promise.all([
        prisma.savedJob.findMany({
            where: whereCondition,
            take: limit,
            skip: (page - 1) * limit,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        salaryMin: true,
                        salaryMax: true,
                        type: true,
                        deadline: true,
                        company: {
                            select: {
                                name: true,
                                logo: true
                            }
                        },
                        category: {
                            select: {
                                name: true
                            }
                        },
                        ward: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
            },
        }),
        prisma.savedJob.count({
            where: whereCondition
        })
    ]);

    return {
        items: data as unknown as SavedItem[],
        total
    };
}