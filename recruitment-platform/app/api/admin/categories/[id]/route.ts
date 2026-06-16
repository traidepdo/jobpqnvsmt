import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const result = await requireAdmin();
        if ("error" in result) return result.error;
        const { id } = await params;

        const category = await prisma.category.delete({ where: { id } });
        return NextResponse.json({ data: category });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
    }
}

// export async function PUT(req: NextRequest) {
//     try {
//         const result = await requireAdmin();
//         if ("error" in result) return result.error;
//         const { searchParams } = new URL(req.url);
//         const id = searchParams.get("id");
//         if (!id) {
//             return NextResponse.json({ error: "Thiếu ID danh mục" }, { status: 400 });
//         }
//         const body = await req.json();
//         const { name, icon, slug } = body;
//         const category = await prisma.category.update({
//             where: { id },
//             data: { name, icon, slug },
//         });
//         return NextResponse.json({ data: category });
//     } catch (error) {
//         console.error(error);
//         return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
//     }
// }