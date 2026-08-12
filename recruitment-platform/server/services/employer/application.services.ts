import { prisma } from '@/lib/prisma';
import { ApplicationStatus } from '@prisma/client';
import { signCloudinaryCvUrl } from '@/lib/cloudinarySign';
import { ApplicationParams } from '@/lib/types/employer/application';

export const ApplicationService = {
    async getAllApplications(employerId: string, params: ApplicationParams) {
        const { categoryId, jobId, status } = params
        const applications = await prisma.application.findMany({
            where: {
                job: {
                    companyId: employerId,
                    ...(categoryId ? { categoryId } : {}),
                },
                ...(status ? { status } : {}),
                ...(jobId ? { jobId } : {}),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                    },
                },
                job: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        category: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    },
                },
                // 🌟 BỔ SUNG THÊM QUAN HỆ RESUME Ở ĐÂY 🌟
                resume: {
                    select: {
                        id: true,
                        title: true,
                        summary: true,
                        address: true,
                        education: true,   // Lấy dữ liệu học vấn JSON
                        experience: true,  // Lấy dữ liệu kinh nghiệm JSON
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const signedApplications = applications.map(app => ({
            ...app,
            cvUrl: signCloudinaryCvUrl(app.cvUrl)
        }));
        return signedApplications;
    }
}