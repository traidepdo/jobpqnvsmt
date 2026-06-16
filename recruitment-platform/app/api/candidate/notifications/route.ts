import { requireCandidate } from "@/lib/requireCandidate";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const auth = await requireCandidate();
    if (auth.error) return auth.error;
    const user = auth.payload;

    const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ notifications });
}