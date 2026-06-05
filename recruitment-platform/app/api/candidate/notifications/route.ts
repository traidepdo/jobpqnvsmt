import { requireCandidate } from "@/lib/requireCandidate";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { payload: user } = await requireCandidate();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ notifications });
}