import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCandidate } from "@/lib/requireCandidate";

export async function PATCH(request: Request) {
    const auth = await requireCandidate();
    if (auth.error) return auth.error;

    try {
        await prisma.notification.updateMany({
            where: {
                userId: auth.payload.id,
                isRead: false,
            },
            data: { isRead: true },
        });

        return NextResponse.json({ message: "Đã đánh dấu tất cả thông báo là đã đọc" });
    } catch (error) {
        console.error("Mark all notifications read error:", error);
        return NextResponse.json(
            { message: "Có lỗi xảy ra khi cập nhật thông báo" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    return PATCH(request);
}
