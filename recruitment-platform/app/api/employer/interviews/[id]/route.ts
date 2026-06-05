import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';

// PATCH — cập nhật / hủy lịch
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireEmployer();
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await req.json();

    // Kiểm tra lịch thuộc công ty
    const existing = await prisma.interview.findFirst({
        where: { id, application: { job: { companyId: auth.company.id } } },
        include: { application: { include: { user: true, job: { select: { title: true } } } } },
    });

    if (!existing) {
        return NextResponse.json({ error: 'Không tìm thấy lịch phỏng vấn' }, { status: 404 });
    }

    const interview = await prisma.interview.update({
        where: { id },
        data: {
            ...(body.scheduledAt && { scheduledAt: new Date(body.scheduledAt), candidateStatus: 'PENDING' }),
            ...(body.type && { type: body.type }),
            ...(body.location && { location: body.location }),
            ...(body.notes !== undefined && { notes: body.notes }),
            ...(body.status && { status: body.status }),
        },
    });

    // Thông báo khi hủy lịch
    if (body.status === 'CANCELLED') {
        await prisma.notification.create({
            data: {
                userId: existing.application.userId,
                type: 'APPLICATION_STATUS_CHANGED',
                title: '❌ Lịch phỏng vấn đã bị hủy',
                content: `Lịch phỏng vấn vị trí "${existing.application.job.title}" đã bị hủy bởi nhà tuyển dụng.`,
                refId: id,
                isRead: false,
            },
        });
    }

    return NextResponse.json({ interview });
}