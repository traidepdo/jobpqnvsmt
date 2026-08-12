import { prisma } from '@/lib/prisma';
import { signCloudinaryCvUrl } from '@/lib/cloudinarySign';
export const CandidateBookmark = {
    async getIsBookmark(id: string) {
        const isBookmark = await prisma.application.findMany({
            where: {
                job: {
                    companyId: id
                },
                isBookmarked: true
            },

            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                    }
                },
                // 🌟 BỔ SUNG QUAN HỆ RESUME GIỐNG BÊN KIA ĐỂ LẤY HỌC VẤN / KINH NGHIỆM
                resume: {
                    select: {
                        id: true,
                        title: true,
                        summary: true,
                        address: true,
                        education: true,
                        experience: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })
        const signedApplications = isBookmark.map(app => ({
            ...app,
            cvUrl: signCloudinaryCvUrl(app.cvUrl)
        }));
        return signedApplications;
    },

    async handleBookmark(userId: string, applicationId: string) {
        const existingApplication = await prisma.application.findFirst({
            where: {
                id: applicationId,
                job: {
                    companyId: userId
                }
            }
        });

        if (!existingApplication) {
            return { success: false, message: "Không tìm thấy hồ sơ ứng tuyển này hoặc bạn không có quyền." };
        }

        const updatedApplication = await prisma.application.update({
            where: { id: applicationId },
            data: {
                isBookmarked: !existingApplication.isBookmarked
            }
        });

        return { success: true, data: updatedApplication };
    },

    async updateStatus(companyId: string, employerUserId: string, applicationId: string, status: 'ACCEPTED' | 'REJECTED' | 'PENDING' | 'REVIEWING') {
        const existingApplication = await prisma.application.findFirst({
            where: {
                id: applicationId,
                job: {
                    companyId: companyId
                }
            }
        });

        if (!existingApplication) {
            return { success: false, message: "Không tìm thấy hồ sơ ứng tuyển này hoặc bạn không có quyền." };
        }

        const updatedApplication = await prisma.application.update({
            where: { id: applicationId },
            data: { status }
        });

        let conversationId: string | null = null;
        if (status === 'ACCEPTED') {
            const existing = await prisma.conversation.findFirst({
                where: { applicationId },
            });

            if (existing) {
                conversationId = existing.id;
            } else {
                const conv = await prisma.conversation.create({
                    data: {
                        applicationId,
                        employerId: employerUserId,
                        candidateId: updatedApplication.userId,
                    },
                });
                conversationId = conv.id;
            }
        }

        return { success: true, data: { application: updatedApplication, conversationId } };
    }
}