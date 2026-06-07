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
    const { jobId, resumeId, coverLetter, quizAnswers, quizDuration } = await req.json();

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
