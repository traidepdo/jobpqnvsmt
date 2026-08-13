import { prisma } from "@/lib/prisma";
import { signCloudinaryCvUrl } from "@/lib/cloudinarySign";
import { Application, CreateApplicationInput } from "@/lib/types/candidate/Application";

export type ApplicationWithDetails = Awaited<ReturnType<typeof ApplicationService.get>>[number];


export const ApplicationService = {
    async get(id: string): Promise<Application[]> {
        const applications = await prisma.application.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        salaryMin: true,
                        salaryMax: true,
                        company: { select: { name: true, logo: true } },
                        category: { select: { name: true } },
                    },
                },
                resume: { select: { id: true, title: true } },
            },
        });
        const data: Application[] = applications.map(app => ({
            ...app,
            cvUrl: app.cvUrl ? signCloudinaryCvUrl(app.cvUrl) : null
        }));
        return data;
    },

    async checkExisting(userId: string, jobId: string) {
        return prisma.application.findUnique({
            where: { userId_jobId: { userId, jobId } },
        });
    },

    async create(params: CreateApplicationInput) {
        const { userId, jobId, resumeId, cvUrl, coverLetter, quizAnswers, quizDuration } = params;

        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job || job.status !== 'ACTIVE') {
            throw new Error('Việc làm không khả dụng');
        }

        const existing = await this.checkExisting(userId, jobId);
        if (existing) {
            throw new Error('Bạn đã ứng tuyển vị trí này rồi');
        }

        if (resumeId) {
            const resume = await prisma.resume.findFirst({
                where: { id: resumeId, userId },
            });
            if (!resume) {
                throw new Error('CV không hợp lệ');
            }
        }

        let quizScore: number | null = null;
        let finalDuration: number | null = null;
        if (job.quizId) {
            if (!Array.isArray(quizAnswers)) {
                throw new Error('Vị trí tuyển dụng này yêu cầu làm bài kiểm tra năng lực trực tuyến.');
            }

            const quiz = await prisma.quiz.findUnique({
                where: { id: job.quizId },
                include: { questions: true },
            });

            if (quiz && quiz.questions.length > 0) {
                let correctCount = 0;
                quiz.questions.forEach((q) => {
                    const answer = quizAnswers.find((ans) => ans.questionId === q.id);
                    if (answer && answer.selectedOption === q.correctOption) {
                        correctCount++;
                    }
                });
                quizScore = Math.round((correctCount / quiz.questions.length) * 100);
                finalDuration = typeof quizDuration === 'number' ? quizDuration : null;
            }
        }

        const app = await prisma.application.create({
            data: {
                userId,
                jobId,
                resumeId: resumeId || null,
                cvUrl: cvUrl || null,
                coverLetter: coverLetter || null,
                quizScore,
                quizDuration: finalDuration,
            },
            include: {
                job: {
                    select: {
                        title: true,
                        company: { select: { name: true, ownerId: true } },
                    },
                },
            },
        });

        try {
            await prisma.job.update({
                where: { id: jobId },
                data: { appliesCount: { increment: 1 } },
            });

            await prisma.notification.create({
                data: {
                    userId,
                    type: 'APPLICATION_RECEIVED',
                    title: 'Ứng tuyển thành công',
                    content: quizScore !== null
                        ? `Bạn đã ứng tuyển vị trí ${app.job.title} tại ${app.job.company?.name || ""} thành công! (Điểm bài test: ${quizScore}%)`
                        : `Bạn đã ứng tuyển vị trí ${app.job.title} tại ${app.job.company?.name || ""} thành công!`,
                    refId: jobId,
                },
            });

            if (app.job.company?.ownerId) {
                await prisma.notification.create({
                    data: {
                        userId: app.job.company.ownerId,
                        type: 'APPLICATION_RECEIVED',
                        title: 'Có ứng viên mới',
                        content: quizScore !== null
                            ? `Có người vừa ứng tuyển vị trí ${app.job.title} (Điểm bài test: ${quizScore}%)`
                            : `Có người vừa ứng tuyển vị trí ${app.job.title}`,
                        refId: app.id,
                    },
                });
            }
        } catch (postErr) {
            console.error("Error creating notifications or updating appliesCount:", postErr);
        }

        return app;
    },

    async delete(id: string, userId: string) {
        const application = await prisma.application.findFirst({
            where: { id, userId },
            include: { job: { select: { title: true } } }
        });

        if (!application) {
            throw new Error('Không tìm thấy đơn ứng tuyển');
        }

        if (application.status !== 'PENDING' && application.status !== 'REVIEWING') {
            throw new Error('Đơn ứng tuyển đã được xử lý, không thể hủy');
        }

        // Lấy danh sách conversationIds thuộc về ứng tuyển này
        const conversations = await prisma.conversation.findMany({
            where: { applicationId: id },
            select: { id: true }
        });

        const conversationIds = conversations.map(c => c.id);

        if (conversationIds.length > 0) {
            // Xóa tất cả tin nhắn thuộc các hội thoại này
            await prisma.message.deleteMany({
                where: { conversationId: { in: conversationIds } },
            });

            // Xóa tất cả cuộc hội thoại này
            await prisma.conversation.deleteMany({
                where: { id: { in: conversationIds } },
            });
        }

        // Xóa đơn ứng tuyển
        return prisma.application.delete({
            where: { id },
        });
    }
};