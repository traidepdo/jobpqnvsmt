import { prisma } from "@/lib/prisma";
import { User, ExperienceItem } from "@/lib/types/candidate/profile";

export async function getDataProfile(idUser: string): Promise<{ user: User; }> {
    const user = await prisma.user.findUnique({
        where: { id: idUser },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            avatar: true,
        },
    });
    const defaultResume = await prisma.resume.findFirst({
        where: { userId: idUser, isDefault: true },
        select: {
            profileSummary: true,
            profileExperience: true,
        },
    }) || await prisma.resume.findFirst({
        where: { userId: idUser },
        orderBy: { updatedAt: 'desc' },
        select: {
            profileSummary: true,
            profileExperience: true,
        },
    });
    const user1: User = {
        id: user?.id || "",
        email: user?.email || "",
        name: user?.name || "",
        phone: user?.phone || "",
        avatar: user?.avatar || "",
        profileSummary: defaultResume?.profileSummary as string | undefined,
        profileExperience: defaultResume?.profileExperience as ExperienceItem[] | undefined,
    };
    return { user: user1 };
}
