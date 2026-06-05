import { NextResponse } from "next/server";
import { requireEmployer } from "@/lib/requireEmployer";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const app = await requireEmployer();

        // 1. Kiểm tra xem có lỗi từ hàm requireEmployer không
        // Nếu có, trả về thẳng response lỗi đó (401, 403, 404...) luôn
        if (app.error) {
            return app.error;
        }

        // 2. Lúc này code và TypeScript đều hiểu chắc chắn 100% app là trường hợp thành công
        // nên có thể gọi app.payload thoải mái
        const notifications = await prisma.notification.findMany({
            where: {
                userId: app.payload.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                title: true,
                content: true,
                type: true,
                isRead: true,
                createdAt: true,
                refId: true,
            },
        });

        return NextResponse.json({ notifications });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}