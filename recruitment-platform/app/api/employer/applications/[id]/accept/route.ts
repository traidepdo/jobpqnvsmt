import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "super-secret-key-123");

export async function PATCH(_: Request, { params }: { params: { id: string } }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const employerId = payload.id as string;

    // Cập nhật status + tạo conversation trong 1 transaction
    const application = await prisma.application.update({
        where: { id: params.id },
        data: { status: "ACCEPTED" },
        include: { job: true },
    });

    // Tạo conversation nếu chưa có
    const conversation = await prisma.conversation.upsert({
        where: { applicationId: params.id },
        create: {
            applicationId: params.id,
            employerId,
            candidateId: application.candidateId,
        },
        update: {},
    });

    // Gửi thông báo cho candidate
    await prisma.notification.create({
        data: {
            userId: application.candidateId,
            title: "Đơn ứng tuyển được chấp nhận! 🎉",
            message: `Bạn đã được chấp nhận vào vị trí "${application.job.title}". Hãy nhắn tin với nhà tuyển dụng để trao đổi thêm.`,
            type: "application",
            link: `/candidate/messages/${conversation.id}`,
        },
    });

    return NextResponse.json({ application, conversation });
}