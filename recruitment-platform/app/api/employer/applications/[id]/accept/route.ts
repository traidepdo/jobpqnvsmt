import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "super-secret-key-123");

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const employerId = payload.id as string;

    const application = await prisma.application.update({
        where: { id },
        data: { status: "ACCEPTED" },
        include: { job: true },
    });

    const conversation = await prisma.conversation.upsert({
        where: { applicationId: id },
        create: {
            applicationId: id,
            employerId,
            candidateId: application.userId,
        },
        update: {},
    });

    await prisma.notification.create({
        data: {
            userId: application.userId,
            type: "APPLICATION_STATUS_CHANGED",
            title: "Đơn ứng tuyển được chấp nhận! 🎉",
            content: `Bạn đã được chấp nhận vào vị trí "${application.job.title}". Hãy nhắn tin với nhà tuyển dụng để trao đổi thêm.`,
            refId: conversation.id,
            isRead: false,
        },
    });

    return NextResponse.json({ application, conversation });
}