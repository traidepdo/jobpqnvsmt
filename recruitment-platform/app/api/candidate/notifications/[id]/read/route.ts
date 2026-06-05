import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCandidate } from "@/lib/requireCandidate";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const auth = await requireCandidate();
    if (auth.error) return auth.error;

    try {
        // Check if the notification belongs to this candidate
        const notification = await prisma.notification.updateMany({
            where: {
                id: params.id,
                userId: auth.payload.id
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