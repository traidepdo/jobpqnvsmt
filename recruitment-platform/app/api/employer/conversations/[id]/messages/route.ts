import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "super-secret-key-123");

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch { return null; }
}

// Lấy tin nhắn
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const messages = await prisma.message.findMany({
        where: { conversationId: id },
        include: { sender: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Nội dung trống" }, { status: 400 });

    const conv = await prisma.conversation.findFirst({
        where: { id, employerId: user.id as string },
    });
    if (!conv) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });

    const [message] = await prisma.$transaction([
        prisma.message.create({
            data: {
                conversationId: id,
                senderId: user.id as string,
                content: content.trim(),
            },
            include: { sender: { select: { id: true, name: true, avatar: true } } },
        }),
        prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() },
        }),
        prisma.notification.create({
            data: {
                userId: conv.candidateId,
                type: "NEW_MESSAGE",
                title: `Tin nhắn mới từ ${user.name || 'Nhà tuyển dụng'}`,
                content: content.trim(),
                refId: id,
            }
        })
    ]);

    return NextResponse.json({ message });
}