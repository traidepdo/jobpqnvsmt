import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';

// GET — danh sách lịch phỏng vấn
export async function GET(req: Request) {
    const auth = await requireEmployer();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const interviews = await prisma.interview.findMany({
        where: {
            application: { job: { companyId: auth.company.id } },
            ...(status ? { status: status as any } : {}),
        },
        include: {
            application: {
                include: {
                    user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
                    job: { select: { id: true, title: true } },
                },
            },
        },
        orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({ interviews });
}

// POST — tạo lịch phỏng vấn
export async function POST(req: Request) {
    const auth = await requireEmployer();
    if (auth.error) return auth.error;

    const { applicationId, scheduledAt, type, location, notes } = await req.json();

    if (!applicationId || !scheduledAt || !location) {
        return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    // Kiểm tra đơn thuộc công ty này
    const application = await prisma.application.findFirst({
        where: { id: applicationId, job: { companyId: auth.company.id } },
        include: { job: { select: { title: true } }, user: true },
    });

    if (!application) {
        return NextResponse.json({ error: 'Không tìm thấy đơn ứng tuyển' }, { status: 404 });
    }

    // Tạo hoặc cập nhật lịch (mỗi đơn chỉ 1 lịch)
    const interview = await prisma.interview.upsert({
        where: { applicationId },
        create: {
            applicationId,
            scheduledAt: new Date(scheduledAt),
            type: type ?? 'ONLINE',
            location,
            notes,
            status: 'SCHEDULED',
            candidateStatus: 'PENDING',
        },
        update: {
            scheduledAt: new Date(scheduledAt),
            type: type ?? 'ONLINE',
            location,
            notes,
            status: 'SCHEDULED',
            candidateStatus: 'PENDING', // reset khi đổi lịch
        },
    });

    // Thông báo candidate
    await prisma.notification.create({
        data: {
            userId: application.userId,
            type: 'APPLICATION_STATUS_CHANGED',
            title: '📅 Bạn có lịch phỏng vấn mới!',
            content: `Nhà tuyển dụng đã đặt lịch phỏng vấn cho vị trí "${application.job.title}" vào ${new Date(scheduledAt).toLocaleString('vi-VN')}. Vui lòng xác nhận lịch.`,
            refId: interview.id,
            isRead: false,
        },
    });

    return NextResponse.json({ interview });
}