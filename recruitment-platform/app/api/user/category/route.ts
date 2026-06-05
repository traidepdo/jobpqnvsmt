import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const categories = await prisma.category.findMany(
            {
                select: {
                    id: true,
                    name: true,
                }
            }
        );

        // Kiểm tra nếu mảng rỗng thì trả về 404 (Nếu bạn muốn thế)
        if (categories.length === 0) {
            return NextResponse.json({ error: "Categories not found" }, { status: 404 });
        }

        // Trả về mảng dữ liệu trực tiếp dưới dạng JSON
        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error getting categories:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}