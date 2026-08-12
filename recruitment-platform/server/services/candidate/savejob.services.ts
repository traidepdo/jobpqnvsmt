import { prisma } from "@/lib/prisma";
import { Query, SavedJobsResponse, SavedItem, SaveJobInput } from "@/lib/types/candidate/SavedJob";

export const saveJobService = {
    async getSavedJobs(id: string,
        { page = 1, limit = 12, query }: Query): Promise<SavedJobsResponse> {
        try {
            const where: any = {
                userId: id,
            };
            if (query && query.trim()) {
                const normalizedQuery = query.trim();
                where.OR = [
                    { job: { title: { contains: normalizedQuery, mode: 'insensitive' } } },
                    { job: { company: { name: { contains: normalizedQuery, mode: 'insensitive' } } } },
                    { job: { category: { name: { contains: normalizedQuery, mode: 'insensitive' } } } },
                    { job: { ward: { name: { contains: normalizedQuery, mode: 'insensitive' } } } },
                ];
            }
            const [data, total] = await Promise.all([
                prisma.savedJob.findMany({
                    where,
                    take: limit,
                    skip: (page - 1) * limit,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        job: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                salaryMin: true,
                                salaryMax: true,
                                type: true,
                                deadline: true,
                                company: {
                                    select: {
                                        name: true,
                                        logo: true
                                    }
                                },
                                category: {
                                    select: {
                                        name: true
                                    }
                                },
                                ward: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        },
                    },

                }),
                prisma.savedJob.count({ where })
            ]);
            return {
                items: data as unknown as SavedItem[],
                total
            };
        } catch (error) {
            console.error("Error getting saved jobs:", error);
            return {
                items: [],
                total: 0
            };
        }
    },

    async save({ userId, jobId }: SaveJobInput) {
        try {
            const isSave = await prisma.savedJob.findUnique({
                where: {
                    userId_jobId: {
                        userId,
                        jobId
                    }
                }
            });
            if (isSave) {
                return {
                    message: "Bạn đã lưu tin tuyển dụng",
                    success: false
                }
            }
            const result = await prisma.savedJob.create({
                data: {
                    userId,
                    jobId
                }
            });
            return {
                message: "Lưu tin tuyển dụng thành công",
                success: true
            };
        } catch (error) {
            console.error("Error saving job:", error);
            return {
                message: "Lỗi khi lưu tin tuyển dụng",
                success: false
            };
        }
    },
    async delectSaveJob({ userId, jobId }: SaveJobInput) {
        try {
            const isSave = await prisma.savedJob.findUnique({
                where: {
                    userId_jobId: {
                        userId,
                        jobId
                    }
                }
            });
            if (!isSave) {
                return {
                    message: "Bạn chưa lưu tin tuyển dụng",
                    success: false
                }
            }
            const result = await prisma.savedJob.delete({
                where: {
                    userId_jobId: { userId, jobId }
                }
            });
            return {
                message: "Đã xóa tin tuyển dụng đã lưu",
                success: true
            };
        } catch (error) {
            console.error("Error deleting saved job:", error);
            return {
                message: "Lỗi khi xóa tin tuyển dụng đã lưu",
                success: false
            };
        }
    }
};

