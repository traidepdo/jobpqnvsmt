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

    if (existing.status !== 'ACTIVE' && updated.status === 'ACTIVE' && updated.companyId) {
        try {
            const followers = await prisma.savedCompany.findMany({
                where: { companyId: updated.companyId },
                select: { userId: true }
            });
            if (followers.length > 0) {
                await prisma.notification.createMany({
                    data: followers.map(f => ({
                        userId: f.userId,
                        type: 'JOB_APPROVED',
                        title: `Tin tuyển dụng mới từ ${updated.company?.name || ""}`,
                        content: `Công ty ${updated.company?.name || ""} mà bạn theo dõi vừa đăng tin tuyển dụng mới: "${updated.title}".`,
                        refId: updated.slug,
                    }))
                });
            }
        } catch (err) {
            console.error("Failed to notify followers on manual job approval (PATCH):", err);
        }
    }

    return NextResponse.json({ job: updated });
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
    const result = await requireAdmin();
    if ('error' in result) return result.error;

    const { id } = await params;

    const body = await req.json();
    const { status, rejectReason } = body;

    const existing = await prisma.job.findUnique({
        where: { id },
        include: {
            company: { select: { ownerId: true, name: true } }
        }
    });
    if (!existing) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const updateData = { ...body };
    if (status === 'REJECTED') {
        updateData.isVisible = false;
    }

    const updated = await prisma.job.update({
        where: { id },
        data: updateData,
        include: {
            company: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
        },
    });

    if (status === 'REJECTED' && existing.company?.ownerId) {
        try {
            await prisma.notification.create({
                data: {
                    userId: existing.company.ownerId,
                    type: 'SYSTEM',
                    title: `Tin tuyển dụng "${existing.title}" bị từ chối duyệt`,
                    content: `Tin tuyển dụng của bạn không được phê duyệt. Lý do: ${rejectReason || 'Không có lý do chi tiết.'}`,
                    refId: id,
                }
            });
        } catch (err) {
            console.error("Failed to create rejection notification:", err);
        }
    }

    if (existing.status !== 'ACTIVE' && updated.status === 'ACTIVE' && updated.companyId && updated.company) {
        try {
            const followers = await prisma.savedCompany.findMany({
                where: { companyId: updated.companyId },
                select: { userId: true }
            });
            if (followers.length > 0) {
                await prisma.notification.createMany({
                    data: followers.map(f => ({
                        userId: f.userId,
                        type: 'JOB_APPROVED',
                        title: `Tin tuyển dụng mới từ ${updated.company?.name || ""}`,
                        content: `Công ty ${updated.company?.name || ""} mà bạn theo dõi vừa đăng tin tuyển dụng mới: "${updated.title}".`,
                        refId: updated.slug,
                    }))
                });
            }
        } catch (err) {
            console.error("Failed to notify followers on manual job approval (PUT):", err);
        }
    }

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