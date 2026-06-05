// app/api/employer/admin-conversations/[id]/messages/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';

type RouteContext = { params: { id: string } };

// GET /api/employer/admin-conversations/[id]/messages
export async function GET(_req: Request, { params }: RouteContext) {
    const auth = await requireEmployer();
    if (auth.error) return auth.error;

    const conversation = await prisma.adminConversation.findFirst({
        where: { id: params.id, employerId: auth.user.id },
    });
    if (!conversation) {
        return NextResponse.json({ error: 'Không tìm thấy cuộc trò chuyện' }, { status: 404 });
    }

    // Đánh dấu đã đọc các tin nhắn từ admin
    await prisma.adminMessage.updateMany({
        where: {
            conversationId: params.id,
            senderId: { not: auth.user.id },
            readAt: null,
        },
        data: { readAt: new Date() },
    });

    const messages = await prisma.adminMessage.findMany({
        where: { conversationId: params.id },
        orderBy: { createdAt: 'asc' },
        include: {
            sender: { select: { id: true, name: true, role: true } },
        },
    });

    return NextResponse.json({ messages });
}

// POST /api/employer/admin-conversations/[id]/messages
export async function POST(req: Request, { params }: RouteContext) {
    const auth = await requireEmployer();
    if (auth.error) return auth.error;

    const conversation = await prisma.adminConversation.findFirst({
        where: { id: params.id, employerId: auth.user.id },
    });
    if (!conversation) {
        return NextResponse.json({ error: 'Không tìm thấy cuộc trò chuyện' }, { status: 404 });
    }

    const { content } = await req.json();
    if (!content?.trim()) {
        return NextResponse.json({ error: 'Nội dung không được để trống' }, { status: 400 });
    }

    const [message] = await prisma.$transaction([
        prisma.adminMessage.create({
            data: {
                conversationId: params.id,
                senderId: auth.user.id,
                content: content.trim(),
            },
            include: {
                sender: { select: { id: true, name: true, role: true } },
            },
        }),
        prisma.adminConversation.update({
            where: { id: params.id },
            data: { updatedAt: new Date() },
        }),
    ]);

    return NextResponse.json({ message }, { status: 201 });
}