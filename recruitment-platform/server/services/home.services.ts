// app/api/home-data/route.ts
import { cookies } from 'next/headers';
import { prisma } from "@/lib/prisma";
import { companyCardSelect } from "@/lib/prismaSafe";
import { verifyToken } from "@/lib/auth";

export async function getdatahome() {
    try {
        // 1. Fetch song song dữ liệu từ Database (sử dụng groupBy để đếm và lọc trực tiếp trên DB)
        const [categoryJobCounts, companyJobCounts, wards] = await Promise.all([
            prisma.job.groupBy({
                by: ['categoryId'],
                _count: {
                    id: true,
                },
                where: {
                    status: 'ACTIVE',
                },
                orderBy: {
                    _count: {
                        id: 'desc',
                    },
                },
                take: 8,
            }),
            prisma.job.groupBy({
                by: ['companyId'],
                _count: {
                    id: true,
                },
                where: {
                    status: 'ACTIVE',
                    company: {
                        isApproved: true,
                        isActive: true,
                    },
                },
                orderBy: {
                    _count: {
                        id: 'desc',
                    },
                },
                take: 5,
            }),
            prisma.ward.findMany({
                select: { id: true, name: true }
            })
        ]);

        // 2. Lấy chi tiết thông tin các Categories và Companies hàng đầu
        const topCategoryIds = categoryJobCounts.map(item => item.categoryId);
        const topCompanyIds = companyJobCounts.map(item => item.companyId).filter((id): id is string => Boolean(id));

        const [categories, initialCompanies] = await Promise.all([
            prisma.category.findMany({
                where: { id: { in: topCategoryIds } },
            }),
            prisma.company.findMany({
                where: {
                    id: { in: topCompanyIds },
                    isApproved: true,
                    isActive: true,
                },
                select: companyCardSelect,
            })
        ]);

        // Đảm bảo đủ tối đa 5 companies bằng cách bù thêm các công ty active khác nếu cần
        let companies = [...initialCompanies];
        if (companies.length < 5) {
            const extraCompanies = await prisma.company.findMany({
                where: {
                    id: { notIn: topCompanyIds },
                    isApproved: true,
                    isActive: true,
                },
                take: 5 - companies.length,
                select: companyCardSelect,
            });
            companies = [...companies, ...extraCompanies];
        }

        // Map ngược số lượng jobs active vào kết quả và sắp xếp
        const categoryCountsMap = new Map(categoryJobCounts.map(item => [item.categoryId, item._count.id]));
        const sortedCategories = categories
            .map(cat => ({
                ...cat,
                _count: {
                    jobs: categoryCountsMap.get(cat.id) || 0
                }
            }))
            .sort((a, b) => b._count.jobs - a._count.jobs);

        const companyCountsMap = new Map(companyJobCounts.map(item => [item.companyId, item._count.id]));
        const sortedCompanies = companies
            .map(comp => ({
                ...comp,
                _count: {
                    jobs: companyCountsMap.get(comp.id) || 0
                }
            }))
            .sort((a, b) => b._count.jobs - a._count.jobs);

        // 3. Kiểm tra Token & Phân quyền user từ Cookie
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        const payload = token ? await verifyToken(token) : null;
        const isLoggedIn = !!payload;
        const isEmployer = payload?.role === 'EMPLOYER';

        // 4. Trả về toàn bộ data dưới dạng JSON
        return {
            success: true,
            data: {
                categories: sortedCategories,
                companies: sortedCompanies,
                wards,
                isLoggedIn,
                isEmployer
            }
        };

    } catch (error) {
        console.error("Error in home-data route:", error);
        return {
            success: false,
            error: "Internal Server Error",
            data: { categories: [], companies: [], wards: [], isLoggedIn: false, isEmployer: false },
        };
    }
}