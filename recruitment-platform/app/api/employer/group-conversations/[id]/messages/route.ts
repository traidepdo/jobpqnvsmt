import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEmployer } from "@/lib/requireEmployer";

// GET messages for group
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireEmployer();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
    const userId = auth.payload.id as string;
    const { id } = await params;

    try {
        // Kiểm tra xem user có phải là member của group không
        const isMember = await prisma.groupMember.findFirst({
            where: { groupId: id, userId: userId }
        });
        if (!isMember) {
            return NextResponse.json({ error: "Không có quyền truy cập nhóm này" }, { status: 403 });
        }

        const messages = await prisma.groupMessage.findMany({
            where: { groupId: id },
            include: {
                sender: { select: { id: true, name: true, avatar: true } }
            },
            orderBy: { createdAt: "asc" }
        });

        return NextResponse.json({ messages });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST send message to group
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireEmployer();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
    const userId = auth.payload.id as string;
    const { id } = await params;

    try {
        const { content } = await req.json();
        if (!content?.trim()) {
            return NextResponse.json({ error: "Nội dung tin nhắn không được trống" }, { status: 400 });
        }

        // Kiểm tra xem user có phải là member của group không
        const isMember = await prisma.groupMember.findFirst({
            where: { groupId: id, userId: userId }
        });
        if (!isMember) {
            return NextResponse.json({ error: "Không có quyền gửi tin nhắn vào nhóm này" }, { status: 403 });
        }

        // Lấy tất cả thành viên khác trong nhóm để gửi thông báo
        const members = await prisma.groupMember.findMany({
            where: { groupId: id, userId: { not: userId } }
        });

        const [message] = await prisma.$transaction([
            prisma.groupMessage.create({
                data: {
                    groupId: id,
                    senderId: userId,
                    content: content.trim()
                },
                include: {
                    sender: { select: { id: true, name: true, avatar: true } }
                }
            }),
            prisma.groupConversation.update({
                where: { id },
                data: { updatedAt: new Date() }
            }),
            prisma.notification.createMany({
                data: members.map(m => ({
                    userId: m.userId,
                    type: "NEW_MESSAGE",
                    title: `Tin nhắn nhóm mới`,
                    content: content.trim(),
                    refId: id
                }))
            })
        ]);

        return NextResponse.json({ message });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
