import { prisma } from "@/lib/prisma";
import { ApprovedApplication, Interview, Job } from "@/lib/types/employer/interviews";
import { title } from "process";




export async function getjob(companyId: string) {
    const jobs = await prisma.job.findMany({
        where: {
            companyId: companyId,
            status: "ACTIVE"
        },
        distinct: ["title"]
    });
    const result: Job[] = jobs.map(item => ({
        id: item.id,
        title: item.title,
    }));
    return result;
}

export async function GetDataAccepted(companyId: string, query?: string): Promise<ApprovedApplication[]> {
    const data = await prisma.application.findMany({
        where: {
            status: "ACCEPTED",
            job: {
                companyId: companyId
            },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatar: true
                }
            },
            job: {
                select: {
                    id: true,
                    title: true
                }
            }
        }
    });

    const result: ApprovedApplication[] = data.map(item => ({
        applicationId: item.id,
        userId: item.user.id,
        name: item.user.name,
        email: item.user.email,
        phone: item.user.phone,
        avatar: item.user.avatar,
        jobTitle: item.job.title,
        jobId: item.job.id,
        appliedAt: item.createdAt.toISOString(),
        isBookmarked: item.isBookmarked,
    }));

    return result;
}

export async function getInterviews(companyId: string): Promise<Interview[]> {
    const interviewsData = await prisma.interview.findMany({
        where: {
            application: {
                job: {
                    companyId: companyId
                }
            }
        },
        include: {
            application: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            avatar: true
                        }
                    },
                    job: {
                        select: {
                            id: true,
                            title: true
                        }
                    }
                }
            }
        },
        orderBy: {
            scheduledAt: 'asc'
        }
    });

    const result: Interview[] = interviewsData.map((iv: any) => ({
        id: iv.id,
        scheduledAt: iv.scheduledAt.toISOString(),
        type: iv.type,
        location: iv.location,
        notes: iv.notes,
        status: iv.status,
        candidateStatus: iv.candidateStatus,
        result: iv.result ?? 'PENDING',
        declineReason: iv.declineReason,
        application: {
            id: iv.application.id,
            user: iv.application.user,
            job: iv.application.job,
        }
    }));

    return result;
}