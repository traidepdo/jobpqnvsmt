import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext) {
    const result = await requireAdmin();
    if ('error' in result) return result.error;

    const { id } = await params;

    const job = await prisma.job.findUnique({
        where: { id },
        include: {
            company: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
        },
    });

    if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
    const result = await requireAdmin();
    if ('error' in result) return result.error;

    const { id } = await params;

    const body = await req.json();

    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const updated = await prisma.job.update({
        where: { id },
        data: body,
        include: {
            company: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
        },
    });

    return NextResponse.json({ job: updated });
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
    const result = await requireAdmin();
    if ('error' in result) return result.error;

    const { id } = await params;

    const body = await req.json();

    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const updated = await prisma.job.update({
        where: { id },
        data: body,
        include: {
            company: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
        },
    });

    return NextResponse.json({ job: updated });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
    const result = await requireAdmin();
    if ('error' in result) return result.error;

    const { id } = await params;

    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await prisma.job.delete({ where: { id } });

    return NextResponse.json({ message: "Job deleted successfully" });
}