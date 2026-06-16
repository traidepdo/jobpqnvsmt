import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-123');

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch { return null; }
}

export async function GET() {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id as string;

    const conversations = await prisma.conversation.findMany({
        where: { candidateId: userId },
        include: {
            employer: { select: { id: true, name: true, avatar: true } },
            application: {
                select: {
                    id: true,
                    job: { select: { id: true, title: true, slug: true } },
                },
            },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    senderId: true,
                },
            },
            _count: {
                select: {
                    messages: {
                        where: {
                            senderId: { not: userId },
                            readAt: null,
                        },
                    },
                },
            },
        },
        orderBy: { updatedAt: 'desc' },
    });

    const result = conversations.map(conv => ({
        ...conv,
        unreadCount: conv._count.messages,
    }));

    return NextResponse.json({ conversations: result });
}