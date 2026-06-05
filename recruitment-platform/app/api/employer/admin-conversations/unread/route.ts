// app/api/employer/admin-conversations/unread/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';

export async function GET() {
    const auth = await requireEmployer();
    if (auth.error) return auth.error;

    const conversation = await prisma.adminConversation.findUnique({
        where: { employerId: auth.payload.id },
        select: { id: true },
    });

    if (!conversation) return NextResponse.json({ unread: 0 });

    const unread = await prisma.adminMessage.count({
        where: {
            conversationId: conversation.id,
            senderId: { not: auth.payload.id },
            readAt: null,
        },
    });

    return NextResponse.json({ unread });
}