// app/api/admin/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

// GET: Lấy danh sách tất cả template (Có Tìm kiếm & Phân trang)
export async function GET(req: NextRequest) {
    try {
        // 1. Kiểm tra quyền Admin
        const auth = await requireAdmin();
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

        // 2. Lấy các query parameters từ URL
        const searchParams = req.nextUrl.searchParams;
        const page = Number(searchParams.get("page") || "1");
        const limit = Number(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category") || "";

        const skip = (page - 1) * limit;

        // 3. Xây dựng điều kiện bộ lọc động (Dynamic Where Clause)
        const where: any = {};

        if (category) {
            where.category = category; // So khớp với Enum TemplateCategory
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } }
            ];
        }

        // 4. Chạy song song: Đếm tổng số lượng và Lấy dữ liệu trang hiện tại (Tối ưu performance)
        const [total, templates] = await Promise.all([
            prisma.resumeTemplate.count({ where }),
            prisma.resumeTemplate.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    category: true,
                    thumbnailUrl: true,
                    createdAt: true,
                    isActive: true, // <-- BẮT BUỘC phải thêm trường này để Client hiển thị trạng thái
                }
            })
        ]);

        const totalPages = Math.ceil(total / limit);

        // 5. Trả về đúng cấu trúc mà Client đang chờ (data và pagination)
        return NextResponse.json({
            ok: true,
            data: templates,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });

    } catch (error) {
        console.error("Lỗi lấy danh sách template: ", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}