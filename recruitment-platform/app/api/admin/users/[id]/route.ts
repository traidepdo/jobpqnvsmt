import { requireAdmin } from '@/lib/requireAdmin';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const result = await requireAdmin();
        if ('error' in result) return result.error;
        const { id } = await params;
        const { isLocked } = await req.json();
        const user = await prisma.user.update({
            where: { id },
            data: { isLocked: Boolean(isLocked) },
        });
        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const result = await requireAdmin();
        if ('error' in result) return result.error;
        const { id } = await params;
        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}