import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEmployer } from "@/lib/requireEmployer";

export async function GET() {
    const auth = await requireEmployer();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

    const userId = auth.payload.id as string;

    const conversations = await prisma.conversation.findMany({
        where: { employerId: userId },
        include: {
            candidate: { select: { id: true, name: true, avatar: true } },
            application: {
                select: {
                    id: true,
                    job: { select: { id: true, title: true, slug: true } },
                },
            },
            messages: {
                orderBy: { createdAt: "desc" },
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
        orderBy: { updatedAt: "desc" },
    });

    const result = conversations.map(conv => ({
        ...conv,
        unreadCount: conv._count.messages,
    }));

    return NextResponse.json({ conversations: result });
}