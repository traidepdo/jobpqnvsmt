import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';
import {
  parseResumeJson,
  type EducationItem,
  type ExperienceItem,
} from '@/lib/renderResume';

import { signCloudinaryCvUrl } from '@/lib/cloudinarySign';

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
            select: { slug: true, name: true },
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
        cvUrl: signCloudinaryCvUrl(application.cvUrl),
        message: 'Ứng viên đính kèm file CV (xem link bên dưới)',
      });
    }
    return NextResponse.json(
      { error: 'Ứng viên chưa chọn CV trên hệ thống', hasResume: false },
      { status: 404 },
    );
  }

  const resume = application.resume;

  return NextResponse.json({
    hasResume: true,
    cvUrl: `/cv/${resume.id}?readOnly=true`,
    resumeTitle: resume.title,
    templateName: resume.template?.name ?? null,
    candidateName: application.user.name,
    resumeData: {
      id: resume.id,
      slug: resume.template?.slug || "classic",
      user: {
        name: application.user.name || '',
        email: application.user.email || '',
        phone: application.user.phone || '',
        avatar: resume.avatarUrl || 'https://i.pravatar.cc/150?img=12',
      },
      resumeDetails: {
        address: resume.address || '',
        summary: resume.summary || '',
        degree: resume.degree || '',
        languages: resume.languages || '',
        socicallink: (resume.socialLinks as any) || [],
        education: resume.education || [],
        experience: resume.experience || [],
        projects: resume.projects || [],
      }
    }
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