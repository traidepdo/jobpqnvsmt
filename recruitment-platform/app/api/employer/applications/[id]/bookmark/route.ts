import { NextRequest, NextResponse } from "next/server";
import { requireEmployer } from "@/lib/requireEmployer";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        // 1. Xác thực tài khoản nhà tuyển dụng
        const auth = await requireEmployer();
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        // 2. Chờ unwrap params để lấy id của application
        const resolvedParams = await params;
        const { id } = resolvedParams;

        // 3. Tìm đơn ứng tuyển hiện tại để kiểm tra trạng thái lưu
        const existingApplication = await prisma.application.findFirst({
            where: {
                id: id,
                job: { companyId: auth.company.id } // Bảo mật: Chỉ công ty đăng tin mới được sửa
            }
        });

        if (!existingApplication) {
            return NextResponse.json(
                { error: "Không tìm thấy hồ sơ ứng tuyển này hoặc bạn không có quyền." },
                { status: 404 }
            );
        }

        // 4. Tiến hành ĐẢO NGƯỢC trạng thái (Toggle logic)
        const updatedApplication = await prisma.application.update({
            where: { id: id },
            data: {
                isBookmarked: !existingApplication.isBookmarked
            }
        });

        // 5. Trả về kết quả cho Frontend
        return NextResponse.json({
            ok: true,
            isBookmarked: updatedApplication.isBookmarked,
            message: updatedApplication.isBookmarked
                ? "Đã đánh dấu ứng viên tiềm năng"
                : "Đã bỏ đánh dấu ứng viên tiềm năng"
        });

    } catch (error: any) {
        console.error("Lỗi cập nhật trạng thái tiềm năng:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}