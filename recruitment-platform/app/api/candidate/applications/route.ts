import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCandidate } from '@/lib/requireCandidate';

export async function GET() {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  const applications = await prisma.application.findMany({
    where: { userId: auth.payload.id },
    orderBy: { createdAt: 'desc' },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          slug: true,
          salaryMin: true,
          salaryMax: true,
          company: { select: { name: true, logo: true } },
          category: { select: { name: true } },
        },
      },
      resume: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({ applications });
}

export async function POST(req: Request) {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  try {
    const { jobId, resumeId, coverLetter } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: 'Thiếu jobId' }, { status: 400 });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Việc làm không khả dụng' }, { status: 404 });
    }

    const existing = await prisma.application.findUnique({
      where: { userId_jobId: { userId: auth.payload.id, jobId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Bạn đã ứng tuyển vị trí này rồi' }, { status: 409 });
    }

    if (resumeId) {
      const resume = await prisma.resume.findFirst({
        where: { id: resumeId, userId: auth.payload.id },
      });
      if (!resume) {
        return NextResponse.json({ error: 'CV không hợp lệ' }, { status: 400 });
      }
    }

    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          userId: auth.payload.id,
          jobId,
          resumeId: resumeId || null,
          coverLetter: coverLetter || null,
        },
        include: { // ← thiếu cái này
          job: {
            select: {
              title: true,
              company: { select: { name: true, ownerId: true } },
            },
          },
        },
      });

      // Thông báo cho ứng viên
      await tx.notification.create({
        data: {
          userId: auth.payload.id,
          type: 'APPLICATION_RECEIVED',
          title: 'Ứng tuyển thành công',
          content: `Bạn đã ứng tuyển vị trí ${app.job.title} tại ${app.job.company.name} thành công!`,
          refId: jobId,
        },
      });

      // Thông báo cho công ty
      await tx.notification.create({
        data: {
          userId: app.job.company.ownerId, // ← gửi đến tài khoản employer
          type: 'APPLICATION_RECEIVED',
          title: 'Có ứng viên mới',
          content: `Có người vừa ứng tuyển vị trí ${app.job.title}`,
          refId: app.id, // ← refId là applicationId để employer click vào xem
        },
      });

      return app;
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Application error:', error);
    return NextResponse.json({ error: 'Không thể nộp hồ sơ' }, { status: 500 });
  }
}
