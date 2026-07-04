import { prisma } from '@/lib/prisma';

export async function getCandidateStats(userId: string) {
    const [applications, savedJobs, resumes, accepted] = await Promise.all([
        prisma.application.count({ where: { userId } }),
        prisma.savedJob.count({ where: { userId } }),
        prisma.resume.count({ where: { userId, isProfile: false } }),
        prisma.application.count({ where: { userId, status: 'ACCEPTED' } }),
    ]);

    return {
        applications,
        savedJobs,
        resumes,
        accepted
    };
}
export async function getRecentApplications(userId: string) {
    const recentApplications = await prisma.application.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
            job: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    company: { select: { name: true, logo: true } },
                },
            },
        },
    });
    return recentApplications;
}

export async function getQuickAccess(userId: string) {
    const [resumes, savedJobs, applications] = await Promise.all([
        prisma.resume.count({ where: { userId, isProfile: false } }),
        prisma.savedJob.count({ where: { userId } }),
        prisma.application.count({ where: { userId } })
    ]);
    return [resumes, savedJobs, applications];
}