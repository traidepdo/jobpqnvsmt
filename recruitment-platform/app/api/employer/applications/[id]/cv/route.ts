import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';
import {
  buildResumePreview,
  parseResumeJson,
  type EducationItem,
  type ExperienceItem,
  type ResumeRenderData,
} from '@/lib/renderResume';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, job: { companyId: auth.company.id } },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      job: { select: { title: true } },
      resume: {
        include: {
          template: {
            select: { htmlContent: true, cssContent: true, name: true },
          },
        },
      },
    },
  });

  if (!application) {
    return NextResponse.json({ error: 'Không tìm thấy đơn ứng tuyển' }, { status: 404 });
  }

  if (!application.resume) {
    if (application.cvUrl) {
      return NextResponse.json({
        hasResume: false,
        cvUrl: application.cvUrl,
        message: 'Ứng viên đính kèm file CV (xem link bên dưới)',
      });
    }
    return NextResponse.json(
      { error: 'Ứng viên chưa chọn CV trên hệ thống', hasResume: false },
      { status: 404 },
    );
  }

  const resume = application.resume;
  const data: ResumeRenderData = {
    name: application.user.name,
    title: application.job.title,
    email: application.user.email,
    phone: application.user.phone || '',
    address: resume.address || '',
    summary: resume.summary || '',
    education: parseResumeJson<EducationItem>(resume.education),
    experience: parseResumeJson<ExperienceItem>(resume.experience),
  };

  const previewDocument = buildResumePreview(
    data,
    resume.template
      ? { htmlContent: resume.template.htmlContent, cssContent: resume.template.cssContent }
      : null,
  );

  return NextResponse.json({
    hasResume: true,
    previewDocument,
    resumeTitle: resume.title,
    templateName: resume.template?.name ?? null,
    candidateName: application.user.name,
  });
}

// ── PATCH: Chấp nhận đơn → tạo conversation → thông báo candidate ──
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const { id } = await params;

  // Kiểm tra đơn thuộc công ty này không
  const application = await prisma.application.findFirst({
    where: { id, job: { companyId: auth.company.id } },
    include: { job: { select: { title: true } } },
  });

  if (!application) {
    return NextResponse.json({ error: 'Không tìm thấy đơn ứng tuyển' }, { status: 404 });
  }

  // Cập nhật status + tạo conversation trong 1 transaction
  const [updatedApp, conversation] = await prisma.$transaction(async (tx) => {
    const updated = await tx.application.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    });

    const conv = await tx.conversation.upsert({
      where: { applicationId: id },
      create: {
        applicationId: id,
        employerId: auth.payload.id,
        candidateId: application.userId,
      },
      update: {},
    });

    // Thông báo cho candidate
    await tx.notification.create({
      data: {
        userId: application.userId,
        type: 'APPLICATION_STATUS_CHANGED',
        title: '🎉 Đơn ứng tuyển được chấp nhận!',
        content: `Bạn đã được chấp nhận vào vị trí "${application.job.title}". Nhắn tin với nhà tuyển dụng để trao đổi thêm.`,
        refId: conv.id,
        isRead: false,
      },
    });

    return [updated, conv];
  });

  return NextResponse.json({
    success: true,
    status: updatedApp.status,
    conversationId: conversation.id,
  });
}