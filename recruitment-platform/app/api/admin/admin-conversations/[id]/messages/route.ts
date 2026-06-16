// app/api/admin/admin-conversations/[id]/messages/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/requireAdmin';

type RouteContext = { params: Promise<{ id: string }> };

// GET - mở conversation → claim luôn nếu chưa ai claim
export async function GET(_req: Request, { params }: RouteContext) {
    const result = await requireAdmin();
    if ('error' in result) return result.error;

    const { id } = await params;

    const conversation = await prisma.adminConversation.findUnique({
        where: { id },
        include: {
            employer: { select: { id: true, name: true, email: true } },
        },
    });
    if (!conversation) {
        return NextResponse.json({ error: 'Không tìm thấy cuộc trò chuyện' }, { status: 404 });
    }

    // Claim nếu chưa ai nhận — atomic để tránh race condition
    if (!conversation.claimedByAdminId) {
        await prisma.adminConversation.updateMany({
            where: { id, claimedByAdminId: null },
            data: { claimedByAdminId: result.payload.id },
        });
    }

    // Đánh dấu đã đọc tất cả tin từ employer
    await prisma.adminMessage.updateMany({
        where: {
            conversationId: id,
            senderId: conversation.employerId,
            readAt: null,
        },
        data: { readAt: new Date() },
    });

    const messages = await prisma.adminMessage.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'asc' },
        include: {
            sender: { select: { id: true, name: true, role: true } },
        },
    });

    return NextResponse.json({ conversation, messages });
}

// POST - admin reply
export async function POST(req: Request, { params }: RouteContext) {
    const result = await requireAdmin();
    if ('error' in result) return result.error;

    const { id } = await params;

    const conversation = await prisma.adminConversation.findUnique({
        where: { id },
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
                conversationId: id,
                senderId: result.payload.id,
                content: content.trim(),
            },
            include: {
                sender: { select: { id: true, name: true, role: true } },
            },
        }),
        prisma.adminConversation.update({
            where: { id },
            data: {
                updatedAt: new Date(),
                ...(!conversation.claimedByAdminId && { claimedByAdminId: result.payload.id }),
            },
        }),
    ]);

    return NextResponse.json({ message }, { status: 201 });
}