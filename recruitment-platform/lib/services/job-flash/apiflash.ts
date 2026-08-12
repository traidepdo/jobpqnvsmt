import { prisma } from "@/lib/prisma";

export interface JobFlash {
    id: string;
    title: string;
    slug: string;
    salaryMin: number | null;
    salaryMax: number | null;
    type: string;
    experience: string | null;
    level: string | null;
    deadline: Date | string | null;
    createdAt: Date | string;
    categoryId: string;
    wardId: string | null;
    company: {
        id: string;
        name: string;
        logo: string | null;
        slug: string;
        ownerId: string;
    } | null;
    category: {
        name: string;
        slug: string;
    };
    ward: {
        name: string;
    } | null;
    salaryStatus?: 'good' | 'average' | 'bad' | null;
    salaryDiff?: number;
}

export async function getJobFlash() {
    const data = await prisma.job.findMany({
        where: {
            jobflash: true,
            deadline: {
                gte: new Date()
            },
            status: "ACTIVE"
        },
        include: {
            company: {
                select: {
                    id: true,
                    name: true,
                    logo: true,
                    slug: true,
                    ownerId: true
                }
            },
            ward: {
                select: {
                    name: true
                }
            },
            category: {
                select: {
                    name: true,
                    slug: true
                }
            }
        }
    })


    const resulf: JobFlash[] = data.map((job) => {
        const salaryStatus = job.salaryMin && job.salaryMin > 10000000 ? 'good' : job.salaryMin && job.salaryMin > 7000000 ? 'average' : 'bad'
        return {
            id: job.id,
            title: job.title,
            slug: job.slug,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            type: job.type,
            experience: job.experience,
            level: job.level,
            deadline: job.deadline,
            createdAt: job.createdAt,
            categoryId: job.categoryId,
            wardId: job.wardId,
            company: job.company ? {
                id: job.company.id,
                name: job.company.name,
                logo: job.company.logo,
                slug: job.company.slug,
                ownerId: job.company.ownerId
            } : null,
            category: {
                name: job.category.name,
                slug: job.category.slug
            },
            ward: job.ward ? {
                name: job.ward.name
            } : null,
            salaryStatus,
            salaryDiff: (job.salaryMax !== null && job.salaryMin !== null) ? job.salaryMax - job.salaryMin : undefined
        }
    })
    return resulf
}
