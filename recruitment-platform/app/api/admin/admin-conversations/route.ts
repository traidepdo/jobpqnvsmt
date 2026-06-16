// app/api/admin/admin-conversations/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET() {
    const result = await requireAdmin();
    if ('error' in result) return result.error;

    const conversations = await prisma.adminConversation.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
            employer: { select: { id: true, name: true, email: true } },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
            _count: {
                select: {
                    // Đếm tất cả tin từ employer chưa đọc, bất kể đã claim hay chưa
                    messages: {
                        where: {
                            readAt: null,
                            sender: { role: { not: 'ADMIN' } },
                        },
                    },
                },
            },
        },
    });

    const mapped = conversations.map(c => ({
        ...c,
        isNew: !c.claimedByAdminId,
        isMine: c.claimedByAdminId === result.payload.id,
        unread: c._count.messages,
    }));

    return NextResponse.json({ conversations: mapped });
}