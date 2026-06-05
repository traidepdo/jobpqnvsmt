// app/api/employer/admin-conversations/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';

// GET - lấy (hoặc tự tạo) thread duy nhất của employer này
export async function GET() {
    const auth = await requireEmployer();
    if (auth.error) return auth.error;

    let conversation = await prisma.adminConversation.findUnique({
        where: { employerId: auth.payload.id },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
                include: {
                    sender: { select: { id: true, name: true, role: true } },
                },
            },
        },
    });

    // Tự tạo nếu chưa có
    if (!conversation) {
        conversation = await prisma.adminConversation.create({
            data: { employerId: auth.payload.id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        sender: { select: { id: true, name: true, role: true } },
                    },
                },
            },
        });
    } else {
        // Đánh dấu đã đọc tin từ admin
        await prisma.adminMessage.updateMany({
            where: {
                conversationId: conversation.id,
                senderId: { not: auth.payload.id },
                readAt: null,
            },
            data: { readAt: new Date() },
        });
    }

    return NextResponse.json({ conversation });
}

// POST - gửi tin nhắn
export async function POST(req: Request) {
    const auth = await requireEmployer();
    if (auth.error) return auth.error;

    const { content } = await req.json();
    if (!content?.trim()) {
        return NextResponse.json({ error: 'Nội dung không được để trống' }, { status: 400 });
    }

    // Upsert conversation
    const conversation = await prisma.adminConversation.upsert({
        where: { employerId: auth.payload.id },
        create: { employerId: auth.payload.id },
        update: { updatedAt: new Date() },
    });

    const message = await prisma.adminMessage.create({
        data: {
            conversationId: conversation.id,
            senderId: auth.payload.id,
            content: content.trim(),
        },
        include: {
            sender: { select: { id: true, name: true, role: true } },
        },
    });

    return NextResponse.json({ message }, { status: 201 });
}