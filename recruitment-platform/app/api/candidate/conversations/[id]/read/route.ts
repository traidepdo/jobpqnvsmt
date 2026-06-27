import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// PATCH /api/candidate/conversations/[id]/read
// Đánh dấu tất cả tin nhắn của đối phương là đã đọc
export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Kiểm tra conversation thuộc về candidate này
    const conv = await prisma.conversation.findFirst({
        where: { id, candidateId: user.id as string },
    });
    if (!conv) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });

    // Chỉ mark tin nhắn của đối phương (employer) chưa đọc
    const { count } = await prisma.message.updateMany({
        where: {
            conversationId: id,
            senderId: { not: user.id as string },
            readAt: null,
        },
        data: { readAt: new Date() },
    });

    // Đồng bộ thông báo tin nhắn của Candidate
    await prisma.notification.updateMany({
        where: {
            userId: user.id as string,
            type: "NEW_MESSAGE",
            refId: id,
            isRead: false,
        },
        data: { isRead: true },
    });

    return NextResponse.json({ markedRead: count });
}