import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const templates = await prisma.resumeTemplate.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                thumbnailUrl: true,
                category: true,
                htmlContent: true,
                cssContent: true
            }
        });

        return NextResponse.json({ templates }, { status: 200 });
    } catch (error) {
        console.error("Error fetching templates:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
