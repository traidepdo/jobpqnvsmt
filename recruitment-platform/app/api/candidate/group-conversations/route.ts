import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// GET all group conversations the candidate belongs to
export async function GET() {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id as string;

    try {
        const groups = await prisma.groupConversation.findMany({
            where: {
                members: {
                    some: { userId: userId }
                }
            },
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
