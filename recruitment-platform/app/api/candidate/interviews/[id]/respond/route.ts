import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = payload.id as string;

    const { id } = await params;
    const { candidateStatus, declineReason } = await req.json();

    if (!['CONFIRMED', 'DECLINED'].includes(candidateStatus)) {
        return NextResponse.json({ error: 'Trạng thái không hợp lệ' }, { status: 400 });
    }

    // Kiểm tra lịch thuộc candidate này
    const existing = await prisma.interview.findFirst({
        where: { id, application: { userId } },
        include: {
            application: {
                include: {
                    job: {
                        select: { title: true, company: { select: { ownerId: true } } }
                    },
                    user: { select: { name: true } },
                },
            },
        },
    });

    if (!existing) {
        return NextResponse.json({ error: 'Không tìm thấy lịch phỏng vấn' }, { status: 404 });
    }

    const interview = await prisma.interview.update({
        where: { id },
        data: {
            candidateStatus,
            ...(declineReason && { declineReason }),
        },
    });

    // Thông báo cho employer
    if (existing.application.job.company?.ownerId) {
        await prisma.notification.create({
            data: {
                userId: existing.application.job.company.ownerId,
                type: 'APPLICATION_STATUS_CHANGED',
                title: candidateStatus === 'CONFIRMED'
                    ? '✅ Ứng viên đã xác nhận lịch phỏng vấn'
                    : '❌ Ứng viên từ chối lịch phỏng vấn',
                content: candidateStatus === 'CONFIRMED'
                    ? `${existing.application.user.name} đã xác nhận tham gia phỏng vấn vị trí "${existing.application.job.title}".`
                    : `${existing.application.user.name} từ chối lịch phỏng vấn vị trí "${existing.application.job.title}".${declineReason ? ` Lý do: ${declineReason}` : ''}`,
                refId: id,
                isRead: false,
            },
        });
    }

    return NextResponse.json({ interview });
}