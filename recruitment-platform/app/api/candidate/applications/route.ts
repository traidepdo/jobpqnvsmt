import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCandidate } from '@/lib/requireCandidate';

import { signCloudinaryCvUrl } from '@/lib/cloudinarySign';

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

  const signedApplications = applications.map(app => ({
    ...app,
    cvUrl: signCloudinaryCvUrl(app.cvUrl)
  }));

  return NextResponse.json({ applications: signedApplications });
}

export async function POST(req: Request) {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  try {
    const { jobId, resumeId, cvUrl, coverLetter, quizAnswers, quizDuration } = await req.json();

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

    // Chấm điểm bài thi trắc nghiệm (nếu có)
    let quizScore: number | null = null;
    let finalDuration: number | null = null;
    if (job.quizId) {
      if (!Array.isArray(quizAnswers)) {
        return NextResponse.json({ error: 'Vị trí tuyển dụng này yêu cầu làm bài kiểm tra năng lực trực tuyến.' }, { status: 400 });
      }

      const quiz = await prisma.quiz.findUnique({
        where: { id: job.quizId },
        include: { questions: true },
      });

      if (quiz && quiz.questions.length > 0) {
        let correctCount = 0;
        quiz.questions.forEach((q) => {
          const answer = quizAnswers.find((ans: any) => ans.questionId === q.id);
          if (answer && answer.selectedOption === q.correctOption) {
            correctCount++;
          }
        });
        quizScore = Math.round((correctCount / quiz.questions.length) * 100);
        finalDuration = typeof quizDuration === 'number' ? quizDuration : null;
      }
    }

    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          userId: auth.payload.id,
          jobId,
          resumeId: resumeId || null,
          cvUrl: cvUrl || null,
          coverLetter: coverLetter || null,
          quizScore,
          quizDuration: finalDuration,
        },
        include: {
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
          content: quizScore !== null 
            ? `Bạn đã ứng tuyển vị trí ${app.job.title} tại ${app.job.company.name} thành công! (Điểm bài test: ${quizScore}%)`
            : `Bạn đã ứng tuyển vị trí ${app.job.title} tại ${app.job.company.name} thành công!`,
          refId: jobId,
        },
      });

      // Thông báo cho công ty
      await tx.notification.create({
        data: {
          userId: app.job.company.ownerId,
          type: 'APPLICATION_RECEIVED',
          title: 'Có ứng viên mới',
          content: quizScore !== null
            ? `Có người vừa ứng tuyển vị trí ${app.job.title} (Điểm bài test: ${quizScore}%)`
            : `Có người vừa ứng tuyển vị trí ${app.job.title}`,
          refId: app.id,
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

function getCloudinaryPublicId(url: string, isRaw: boolean = false): string | null {
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const pathAfterUpload = parts[1];
    const pathParts = pathAfterUpload.split('/');
    if (pathParts[0].startsWith('v') && !isNaN(Number(pathParts[0].substring(1)))) {
      pathParts.shift();
    }
    const publicIdWithExt = pathParts.join('/');
    if (isRaw) {
      return publicIdWithExt;
    }
    return publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
  } catch (e) {
    return null;
  }
}

export async function DELETE(req: Request) {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu mã đơn ứng tuyển' }, { status: 400 });
    }

    const application = await prisma.application.findFirst({
      where: { id, userId: auth.payload.id },
      include: { job: { select: { title: true } } }
    });

    if (!application) {
      return NextResponse.json({ error: 'Không tìm thấy đơn ứng tuyển' }, { status: 404 });
    }

    // Only allow cancelling if PENDING or REVIEWING
    if (application.status !== 'PENDING' && application.status !== 'REVIEWING') {
      return NextResponse.json({ error: 'Đơn ứng tuyển đã được xử lý, không thể hủy' }, { status: 400 });
    }

    // Delete CV from Cloudinary if it was uploaded
    if (application.cvUrl) {
      try {
        const publicId = getCloudinaryPublicId(application.cvUrl, true);
        if (publicId) {
          const { v2: cloudinary } = await import('cloudinary');
          cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
          });
          await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        }
      } catch (cloudinaryErr) {
        console.error('Failed to delete CV from Cloudinary:', cloudinaryErr);
      }
    }

    await prisma.application.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Hủy ứng tuyển thành công' });
  } catch (error) {
    console.error('Cancel application error:', error);
    return NextResponse.json({ error: 'Không thể hủy ứng tuyển' }, { status: 500 });
  }
}
