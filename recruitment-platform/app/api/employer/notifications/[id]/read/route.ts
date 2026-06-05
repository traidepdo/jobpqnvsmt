import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEmployer } from "@/lib/requireEmployer";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const app = await requireEmployer();
        if (app.error) return app.error;

        const notification = await prisma.notification.updateMany({
            where: {
                id: id,
                userId: app.payload.id,
            },
            data: { isRead: true },
        });

        if (notification.count === 0) {
            return NextResponse.json(
                { message: "Không tìm thấy thông báo" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Đã cập nhật thông báo" });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Có lỗi xảy ra" },
            { status: 500 }
        );
    }
}