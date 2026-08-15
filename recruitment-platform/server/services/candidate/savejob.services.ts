import { prisma } from "@/lib/prisma";
import { Query, SavedJobsResponse, SavedItem, SaveJobInput } from "@/lib/types/candidate/SavedJob";

export const saveJobService = {
    async getSavedJobs(id: string,
        { page = 1, limit = 12, query, fromDate, toDate, period, category }: Query): Promise<SavedJobsResponse> {
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
            if (category && category.trim()) {
                where.job = {
                    ...(where.job || {}),
                    category: {
                        OR: [
                            { slug: category.trim() },
                            { id: category.trim() }
                        ]
                    }
                };
            }

            // Xử lý lọc theo ngày / khoảng thời gian
            let startDate: Date | undefined;
            let endDate: Date | undefined;

            if (period) {
                const now = new Date();
                if (period === 'today') {
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                } else if (period === '7days') {
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                } else if (period === '30days') {
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                } else if (period === 'thisMonth') {
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                }
            } else {
                if (fromDate) {
                    startDate = new Date(`${fromDate}T00:00:00.000Z`);
                }
                if (toDate) {
                    endDate = new Date(`${toDate}T23:59:59.999Z`);
                }
            }

            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = startDate;
                if (endDate) where.createdAt.lte = endDate;
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

