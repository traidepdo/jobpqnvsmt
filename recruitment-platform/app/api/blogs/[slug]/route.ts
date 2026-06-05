import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> }
) {
    try {
        const slug = (await context.params).slug;
        const { searchParams } = request.nextUrl;

        // 1. Phân trang an toàn (Tránh limit = 0 hoặc số âm)
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10"))); // Giới hạn tối đa 50 bài/trang chống spam
        const skip = (page - 1) * limit;

        // Từ khóa tìm kiếm bổ sung (Nếu frontend có thanh tìm kiếm trong danh mục)
        const search = searchParams.get("search") || "";

        // 2. Lấy thông tin chi tiết của Danh mục trước để phục vụ SEO
        const currentCategory = await prisma.blogCategory.findUnique({
            where: { slug: slug },
            select: {
                id: true,
                name: true,
                slug: true,
            }
        });

        // Nếu không tồn tại danh mục ngành nghề này -> Trả về lỗi 404 ngay lập tức giúp Google không index trang rác
        if (!currentCategory) {
            return NextResponse.json(
                { ok: false, error: "Danh mục ngành nghề này không tồn tại." },
                { status: 404 }
            );
        }

        // 3. Xây dựng điều kiện lọc bài viết
        const whereCondition: any = {
            categoryId: currentCategory.id, // Lọc chính xác theo ID danh mục tìm được
        };

        // Nếu người dùng có gõ ô tìm kiếm, lọc thêm theo Tiêu đề bài viết
        if (search) {
            whereCondition.title = {
                contains: search,
                mode: "insensitive" // Không phân biệt chữ hoa chữ thường
            };
        }

        // 4. Chạy song song lệnh đếm tổng bài và lấy data bài viết
        const [total, blogs] = await Promise.all([
            prisma.blog.count({ where: whereCondition }),
            prisma.blog.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc' // Chuẩn Blog: Bài mới viết luôn nằm lên đầu
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnail: true,
                    excerpt: true,     // BẮT BUỘC PHẢI CÓ: Đoạn mô tả ngắn bài viết (Dùng làm thẻ meta description bài viết)
                    createdAt: true,
                    updatedAt: true,
                    // Lấy thông tin tác giả để tăng độ uy tín với thuật toán Google E-E-A-T
                    author: {
                        select: {
                            name: true,
                            avatar: true
                        }
                    },
                    // Lấy danh sách tags liên quan
                }
            })
        ]);

        const hasNext = skip + limit < total;
        const hasPrevious = page > 1;

        // 5. Kết cấu dữ liệu trả về hoàn hảo cho Frontend render SEO
        return NextResponse.json({
            ok: true,
            data: {
                category: currentCategory, // Dữ liệu dùng để làm Thẻ Tiêu đề trang, Thẻ Meta SEO ngành nghề
                blogs,                     // Danh sách bài viết hiển thị ra giao diện
                pagination: {
                    total,
                    page,
                    limit,
                    hasNext,
                    hasPrevious,
                    totalPages: Math.ceil(total / limit)
                },
            },
        });
    } catch (error) {
        console.error("API Góc Ngành Nghề Lỗi:", error);
        return NextResponse.json(
            { ok: false, error: "Đã xảy ra lỗi máy chủ nội bộ." },
            { status: 500 }
        );
    }
}