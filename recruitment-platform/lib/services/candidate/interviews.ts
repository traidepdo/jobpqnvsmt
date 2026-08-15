import { prisma } from "@/lib/prisma";
import { Interview } from "@/lib/types/candidate/interviews";

interface QueryProps {
    id: string;
    status?: string;
}

export async function getInterviews({ id, status }: QueryProps) {
    const where: any = {
        application: {
            userId: id,
        },
    };

    if (status) {
        const uppercaseStatus = status.toUpperCase();
        if (uppercaseStatus === 'PENDING' || uppercaseStatus === 'CONFIRMED' || uppercaseStatus === 'DECLINED') {
            where.candidateStatus = uppercaseStatus;
        } else if (uppercaseStatus === 'PASSED' || uppercaseStatus === 'FAILED') {
            where.result = uppercaseStatus;
        } else if (uppercaseStatus === 'SCHEDULED' || uppercaseStatus === 'COMPLETED' || uppercaseStatus === 'CANCELLED') {
            where.status = uppercaseStatus;
        }
    }

    const data = await prisma.interview.findMany({
        where,
        include: {
            application: {
                include: {
                    job: {
                        include: {
                            category: { select: { name: true } },
                            company: { select: { id: true, name: true, logo: true, industry: true } },
                        },
                    },
                },
            },
        },
        orderBy: { scheduledAt: 'asc' },
    });

    return data.map(
        (interview: any) => ({
            id: interview.id,
            scheduledAt: interview.scheduledAt.toISOString(),
            type: interview.type,
            location: interview.location,
            notes: interview.notes,
            status: interview.status,
            candidateStatus: interview.candidateStatus,
            result: interview.result ?? 'PENDING',
            declineReason: interview.declineReason,
            application: {
                id: interview.application.id,
                job: {
                    title: interview.application.job.title,
                    category: interview.application.job.category ? { name: interview.application.job.category.name } : null,
                    company: {
                        name: interview.application.job.company.name,
                        logo: interview.application.job.company.logo,
                        industry: interview.application.job.company.industry ?? null,
                    },
                },
            },
        })
    );
}