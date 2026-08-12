import { prisma } from "@/lib/prisma";
import type { IQueryCompany, ItemCompany } from "@/lib/types/company";

export const companyService = {
    async getList(query: IQueryCompany) {
        try {
            // 1. Chuẩn hóa phân trang
            const page = Math.max(1, Number(query.page) || 1);
            const limit = Math.max(1, Number(query.limit) || 10);
            const skip = (page - 1) * limit;

            const whereClause: any = {
                isApproved: true,
                isActive: true,
            };

            if (query.industry) {
                whereClause.jobs = {
                    some: {
                        status: 'ACTIVE',
                        category: {
                            slug: query.industry,
                        },
                    },
                };
            }

            if (query.search) {
                whereClause.name = {
                    contains: query.search,
                    mode: 'insensitive',
                };
            }

            // 2. Query Database bằng Transaction
            const [companies, total] = await prisma.$transaction([
                prisma.company.findMany({
                    where: whereClause,
                    include: {
                        ward: {
                            include: {
                                district: {
                                    include: {
                                        province: true
                                    }
                                }
                            }
                        },
                        _count: {
                            select: {
                                jobs: {
                                    where: {
                                        status: 'ACTIVE',
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    skip,
                    take: limit,
                }),
                prisma.company.count({ where: whereClause })
            ]);

            const totalpage = Math.ceil(total / limit);

            // 3. Map dữ liệu chuẩn khớp hoàn toàn với ItemCompany
            const result: ItemCompany[] = companies.map((company) => {
                const ward = company.ward;
                const district = ward?.district ?? null;
                const province = district?.province ?? null;

                return {
                    ...company,
                    // Móc district & province ra cấp ngoài cùng cho ItemCompany
                    district: district,
                    province: province,
                } as unknown as ItemCompany;
                // Sử dụng 'as unknown as ItemCompany' nếu Prisma tự động sinh type 
                // có sự khác biệt nhỏ về Date/Nullability với ItemCompany interface của bạn
            });

            return {
                companies: result,
                totalpage,
                total,
            };

        } catch (error) {
            console.error("Lỗi tại companyService.getList:", error);
            return {
                companies: [],
                totalpage: 0,
                total: 0,
            };
        }
    }
};