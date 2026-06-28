import { prisma } from "@/lib/prisma";
import { Interview } from "@/lib/types/candidate/interviews";

export async function getInterviews({ id }: { id: string }) {
    const data = await prisma.interview.findMany({
        where: {
            application: {
                userId: id,
            },
        },
        include: {
            application: {
                include: {
                    job: {
                        include: {
                            company: { select: { id: true, name: true, logo: true } },
                        },
                    },
                },
            },
        },
        orderBy: { scheduledAt: 'asc' },
    })

    return data.map(
        (interview: any) => ({
            id: interview.id,
            scheduledAt: interview.scheduledAt.toISOString(),
            type: interview.type,
            location: interview.location,
            notes: interview.notes,
            status: interview.status,
            candidateStatus: interview.candidateStatus,
            declineReason: interview.declineReason,
            application: {
                id: interview.application.id,
                job: {
                    title: interview.application.job.title,
                    company: {
                        name: interview.application.job.company.name,
                        logo: interview.application.job.company.logo,
                    },
                },
            },
        })
    );
}