import { prisma } from "@/lib/prisma";
import { getUserID } from "./userID.action";
import { JobStatus } from "@prisma/client";

export const Jobs = {
    async get(param?: { status?: string; isVisible?: string; page?: number; limit?: number }) {
        const { status, isVisible, page = 1, limit = 10 } = param || {};
        const auth = await getUserID();
        if (!auth.success || !auth.data) {
            return {
                jobs: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false,
                },
            };
        }

        const skip = (page - 1) * limit;
        const where = {
            companyId: auth.data,
            ...(status && { status: status as JobStatus }),
            ...(isVisible === 'true' && { isVisible: true }),
            ...(isVisible === 'false' && { isVisible: false }),
        };

        const [jobs, total] = await Promise.all([
            prisma.job.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    category: { select: { name: true } },
                    ward: { select: { name: true } },
                    _count: { select: { applications: true } },
                },
            }),
            prisma.job.count({ where }),
        ]);

        return {
            jobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    }
};