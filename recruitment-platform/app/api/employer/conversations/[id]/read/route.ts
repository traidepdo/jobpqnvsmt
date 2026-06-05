import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';

// PATCH /api/employer/conversations/[id]/read
// Đánh dấu tất cả tin nhắn của candidate là đã đọc (từ phía employer)
export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireEmployer();
    if (auth.error) return auth.error;

    const { id } = await params;

    // Kiểm tra conversation thuộc về employer này
    const conv = await prisma.conversation.findFirst({
        where: { id, employerId: auth.payload.id },
    });
    if (!conv) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });

    const { count } = await prisma.message.updateMany({
        where: {
            conversationId: id,
            senderId: { not: auth.payload.id as string },
            readAt: null,
        },
        data: { readAt: new Date() },
    });

    return NextResponse.json({ markedRead: count });
}