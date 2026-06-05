import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEmployer } from "@/lib/requireEmployer";

// GET all group conversations for employer
export async function GET() {
    const auth = await requireEmployer();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
    const userId = auth.payload.id as string;

    try {
        const groups = await prisma.groupConversation.findMany({
            where: { employerId: userId },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true } }
                    }
                },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    include: {
                        sender: { select: { id: true, name: true, avatar: true } }
                    }
                }
            },
            orderBy: { updatedAt: "desc" }
        });

        return NextResponse.json({ groups });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST create new group conversation
export async function POST(req: NextRequest) {
    const auth = await requireEmployer();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
    const userId = auth.payload.id as string;

    try {
        const { name, candidateIds } = await req.json();
        if (!name?.trim()) {
            return NextResponse.json({ error: "Tên nhóm không được trống" }, { status: 400 });
        }
        if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
            return NextResponse.json({ error: "Thành viên nhóm không được trống" }, { status: 400 });
        }

        // Tạo group conversation và thêm members (kèm employer và các candidates)
        const group = await prisma.groupConversation.create({
            data: {
                name: name.trim(),
                employerId: userId,
                members: {
                    create: [
                        { userId: userId }, // Employer
                        ...candidateIds.map((cid: string) => ({ userId: cid }))
                    ]
                }
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true } }
                    }
                }
            }
        });

        return NextResponse.json({ group });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
