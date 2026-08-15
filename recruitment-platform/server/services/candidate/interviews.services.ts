import { prisma } from "@/lib/prisma";
import { Interview } from "@/lib/types/candidate/interviews";
export const getInterviewsByCandidateId = {
    async get(id: string) {
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

        const resulf: Interview[] = data.map(i => ({
            id: i.id,
            scheduledAt: i.scheduledAt.toISOString(),
            type: i.type,
            location: i.location,
            notes: i.notes,
            status: i.status,
            candidateStatus: i.candidateStatus,
            result: i.result ?? 'PENDING',
            declineReason: i.declineReason,
            application: {
                id: i.application.id,
                job: {
                    title: i.application.job.title,
                    company: {
                        name: i.application.job.company?.name ?? "",
                        logo: i.application.job.company?.logo ?? "",
                    },
                },
            },
        })
        );
    },
    async updateCandidateStatus(id: string, userId: string, candidateStatus: string, declineReason: string) {



    }
};