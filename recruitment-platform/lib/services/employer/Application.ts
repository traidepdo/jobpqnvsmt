import { prisma } from "@/lib/prisma";
import { Application } from '@/lib/types/employer/application';

interface GetApplicationsParams {
    employerId: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    status?: string;
    isVisible?: string;
    jobId?: string;
    query?: string;
}

export async function getApplications(params: GetApplicationsParams) {
    const limit = params.limit || 10;
    const page = params.page || 1;
    const skip = (page - 1) * limit;

    const where: any = {
        job: {
            company: {
                ownerId: params.employerId,
            }
        }
    };

    if (params.category) {
        where.job.categoryId = params.category;
    }

    if (params.isVisible) {
        where.job.isVisible = params.isVisible === 'true';
    }

    if (params.jobId) {
        where.jobId = params.jobId;
    }

    if (params.search) {
        where.user = {
            name: { contains: params.search, mode: 'insensitive' }
        };
    }

    if (params.status) {
        where.status = params.status;
    }

    if (params.query) {
        where.OR = [
            { user: { name: { contains: params.query, mode: 'insensitive' } } },
            { user: { email: { contains: params.query, mode: 'insensitive' } } },
        ];
    }

    const [applicationsData, total] = await Promise.all([
        prisma.application.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                    }
                },
                job: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        company: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                resume: {
                    select: {
                        id: true,
                        title: true,
                        summary: true,
                        address: true,
                        education: true,
                        experience: true,
                        isProfile: true,
                    }
                },
                conversation: {
                    select: {
                        id: true
                    }
                }
            },
        }),
        prisma.application.count({ where }),
    ]);

    const applications: Application[] = applicationsData.map((app) => ({
        id: app.id,
        status: app.status,
        coverLetter: app.coverLetter || null,
        createdAt: app.createdAt.toISOString(),
        isBookmarked: app.isBookmarked,
        user: {
            id: app.user.id,
            name: app.user.name,
            email: app.user.email,
            phone: app.user.phone,
            avatar: app.user.avatar,
        },
        job: {
            id: app.job.id,
            title: app.job.title,
            slug: app.job.slug,
        },
        resume: app.resume ? {
            id: app.resume.id,
            title: app.resume.title,
            summary: app.resume.summary,
            address: app.resume.address,
            education: app.resume.education,
            experience: app.resume.experience,
        } : null,
        cvUrl: app.cvUrl,
        conversationId: app.conversation?.id || null,
        quizScore: app.quizScore,
        quizDuration: app.quizDuration,
        matchScore: app.matchScore,
    }));

    return { applications, pagination: { page, limit, total } };
}
