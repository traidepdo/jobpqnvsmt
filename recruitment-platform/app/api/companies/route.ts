import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Lấy bộ lọc từ query string
        const industry = searchParams.get("industry");
        const search = searchParams.get("search");

        // Phân trang (mặc định page=1, limit=10)
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        // Khởi tạo điều kiện lọc WHERE động cho Prisma
        const whereClause: any = {};

        // Lọc theo ngành nghề nếu có
        if (industry) {
            whereClause.industry = industry;
        }

        // Tìm kiếm theo tên (không phân biệt hoa thường) nếu có
        if (search) {
            whereClause.name = {
                contains: search,
            };
        }

        // Chạy song song: Lấy danh sách + Đếm tổng số bản ghi
        const [companies, total] = await prisma.$transaction([
            prisma.company.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    logo: true,
                    industry: true,
                    size: true,
                    description: true,
                    addressDetail: true,
                    ward: {
                        select: {
                            name: true,
                            district: {
                                select: {
                                    name: true,
                                    province: {
                                        select: { name: true }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip: skip,
                take: limit,
            }),
            prisma.company.count({ where: whereClause })
        ]);

        // Luôn trả về cấu trúc JSON hợp lệ
        return NextResponse.json({
            ok: true,
            companies,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            }
        });

    } catch (error: any) {
        console.error("Lỗi sập Server API Companies:", error);
        // Ép kiểu trả về JSON để Frontend không bị lỗi nuốt thẻ HTML (<!DOCTYPE html>)
        return NextResponse.json(
            {
                ok: false,
                companies: [],
                error: error.message || "Internal server error",
                pagination: { total: 0, page: 1, limit: 10, totalPages: 1 }
            },
            { status: 500 }
        );
    }
}