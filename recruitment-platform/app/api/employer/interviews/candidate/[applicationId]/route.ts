// app/api/employer/interviews/application/[applicationId]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';

/**
 * GET /api/employer/interviews/application/[applicationId]
 * Trả về thông tin ứng viên + chi tiết đơn ứng tuyển (ACCEPTED) kèm lịch phỏng vấn nếu có.
 * Chỉ trả về nếu đơn thuộc công ty của employer đang đăng nhập.
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ applicationId: string }> }
) {
    const auth = await requireEmployer();
    if (auth.error) return auth.error;

    const { applicationId } = await params;

    const app = await prisma.application.findFirst({
        where: {
            id: applicationId,
            status: 'ACCEPTED',
            job: { companyId: auth.company.id },
        },
        include: {
            user: {
                select: { id: true, name: true, email: true, phone: true, avatar: true },
            },
            job: {
                select: { id: true, title: true },
            },
            interview: true,
        },
    });

    if (!app) {
        return NextResponse.json({ error: 'Không tìm thấy đơn ứng tuyển' }, { status: 404 });
    }

    return NextResponse.json({
        candidate: app.user,
        application: {
            id: app.id,
            jobTitle: app.job.title,
            jobId: app.job.id,
            appliedAt: app.createdAt,
            interview: app.interview
                ? {
                    id: app.interview.id,
                    scheduledAt: app.interview.scheduledAt,
                    type: app.interview.type,
                    location: app.interview.location,
                    notes: app.interview.notes,
                    status: app.interview.status,
                    candidateStatus: app.interview.candidateStatus,
                    declineReason: app.interview.declineReason,
                }
                : null,
        },
    });
}