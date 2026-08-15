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

    const isGrading = body.result === 'PASSED' || body.result === 'FAILED' || body.status === 'COMPLETED';

    // RÀNG BUỘC NGHIỆP VỤ: Candidate phải xác nhận rồi mới được chấm phỏng vấn / hoàn thành
    if (isGrading && existing.candidateStatus !== 'CONFIRMED') {
        return NextResponse.json(
            { error: 'Ứng viên chưa xác nhận tham gia lịch phỏng vấn. Bạn chỉ có thể chấm kết quả sau khi ứng viên đã xác nhận.' },
            { status: 400 }
        );
    }

    const updateData: any = {};
    if (body.scheduledAt) {
        updateData.scheduledAt = new Date(body.scheduledAt);
        updateData.candidateStatus = 'PENDING';
        updateData.result = 'PENDING';
    }
    if (body.type) updateData.type = body.type;
    if (body.location) updateData.location = body.location;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.status) updateData.status = body.status;

    if (body.result) {
        updateData.result = body.result;
        updateData.status = 'COMPLETED'; // Đã chấm kết quả -> auto đánh dấu Hoàn thành
    }

    const interview = await prisma.interview.update({
        where: { id },
        data: updateData,
    });

    // Nếu chấm ĐẬU / RỚT -> cập nhật luôn trạng thái đơn ứng tuyển ApplicationStatus & gửi thông báo
    if (body.result === 'PASSED') {
        await prisma.application.update({
            where: { id: existing.applicationId },
            data: { status: 'ACCEPTED' },
        });

        await prisma.notification.create({
            data: {
                userId: existing.application.userId,
                type: 'APPLICATION_STATUS_CHANGED',
                title: '🎉 Kết quả phỏng vấn: ĐẬU!',
                content: `Chúc mừng! Bạn đã ĐẬU phỏng vấn cho vị trí "${existing.application.job.title}". Nhà tuyển dụng sẽ sớm liên hệ với bạn để trao đổi tiếp.`,
                refId: id,
                isRead: false,
            },
        });
    } else if (body.result === 'FAILED') {
        await prisma.application.update({
            where: { id: existing.applicationId },
            data: { status: 'REJECTED' },
        });

        await prisma.notification.create({
            data: {
                userId: existing.application.userId,
                type: 'APPLICATION_STATUS_CHANGED',
                title: '📢 Thông báo kết quả phỏng vấn',
                content: `Cảm ơn bạn đã tham gia phỏng vấn cho vị trí "${existing.application.job.title}". Rất tiếc kết quả chưa đạt yêu cầu đợt này.`,
                refId: id,
                isRead: false,
            },
        });
    } else if (body.status === 'CANCELLED') {
        // Thông báo khi hủy lịch
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