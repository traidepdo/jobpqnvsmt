import { requireAdmin } from "@/lib/requireAdmin";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const result = await requireAdmin();
        const { id } = await params;
        if ("error" in result) return result.error;
        const { isApproved, isActive } = await req.json();
        const company = await prisma.company.update({
            where: { id: id },
            data: { isApproved, isActive },
        })
        return NextResponse.json({ company });
    } catch (error) {
        console.error("Error updating company:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const result = await requireAdmin();
        const { id } = await params;
        if ("error" in result) return result.error;
        const company = await prisma.company.delete({
            where: { id: id },
        })
        return NextResponse.json({ company });
    } catch (error) {
        console.error("Error deleting company:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}