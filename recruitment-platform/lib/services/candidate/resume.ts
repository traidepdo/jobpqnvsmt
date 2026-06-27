import { prisma } from "@/lib/prisma";

export async function getResume(id: string) {
    const resumes = await prisma.resume.findMany({
        where: { userId: id },
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            title: true,
            isDefault: true,
            address: true,
            summary: true,
            education: true,
            experience: true,
            avatarUrl: true,
            cvData: true,
            createdAt: true,
            updatedAt: true,
            template: { select: { id: true, name: true, slug: true, thumbnailUrl: true } },
            _count: { select: { applications: true } },
        },
    });
    if (!resumes) {
        throw new Error("Resume not found");
    }
    return resumes.map(r => ({
        id: r.id,
        title: r.title,
        isDefault: r.isDefault,
        address: r.address,
        summary: r.summary,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        template: r.template,
        _count: {
            applications: r._count.applications
        }
    }));
}