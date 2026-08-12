import { prisma } from "@/lib/prisma";
import { ExperienceItem, UpdateCandidateProfileInput, User } from "@/lib/types/candidate/profile";

export const updateCandidateProfileService = {
    async get(idUser: string) {
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
    },


    update: async (userId: string, data: UpdateCandidateProfileInput) => {
        try {
            const updatebase = await prisma.user.update({
                where: { id: userId },
                data: {
                    name: data.name,
                    phone: data.phone,
                }
            })
            let resume = await prisma.resume.findFirst({
                where: { userId: userId, isDefault: true },
            }) || await prisma.resume.findFirst({
                where: { userId: userId },
                orderBy: { updatedAt: 'desc' },
            });
            if (resume) {
                await prisma.resume.update({
                    where: { id: resume.id },
                    data: {
                        profileSummary: data.profileSummary,
                        profileExperience: data.profileExperience,
                        isProfile: true,
                    }
                })
            } else {
                await prisma.resume.create({
                    data: {
                        userId: userId,
                        title: 'Hồ sơ của tôi',
                        isDefault: true,
                        profileSummary: data.profileSummary,
                        profileExperience: data.profileExperience,
                        isProfile: true,
                    }
                })
            }
            const resulf: User = {
                id: updatebase.id,
                email: updatebase.email,
                name: updatebase.name,
                phone: updatebase.phone as string,
                avatar: updatebase.avatar as string,
                profileSummary: data.profileSummary,
                profileExperience: data.profileExperience,
            }
            return {
                success: true,
                user: resulf
            };
        } catch (error) {
            console.error("Error updating candidate profile:", error);
            return { success: false, error: "Failed to update candidate profile" };
        }

    },


};
