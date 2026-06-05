import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const user = auth.payload;

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error("Fetch admin notifications error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
