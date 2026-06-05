import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

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

// GET group messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id as string;
    const { id } = await params;

    try {
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

// POST send group message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id as string;
    const { id } = await params;

    try {
        const { content } = await req.json();
        if (!content?.trim()) {
            return NextResponse.json({ error: "Nội dung tin nhắn không được trống" }, { status: 400 });
        }

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
