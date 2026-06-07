import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';

export async function GET() {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  try {
    const quizzes = await prisma.quiz.findMany({
      where: { employerId: auth.payload.id },
      include: {
        _count: { select: { questions: true, jobs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('Fetch quizzes error:', error);
    return NextResponse.json({ error: 'Không thể tải danh sách bài thi' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { title, description, timeLimit, questions } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập tiêu đề bài thi' }, { status: 400 });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Bài thi phải có ít nhất 1 câu hỏi' }, { status: 400 });
    }

    // Validate questions structure
    for (const q of questions) {
      if (!q.content?.trim()) {
        return NextResponse.json({ error: 'Nội dung câu hỏi không được để trống' }, { status: 400 });
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return NextResponse.json({ error: 'Câu hỏi phải có ít nhất 2 đáp án lựa chọn' }, { status: 400 });
      }
      if (typeof q.correctOption !== 'number' || q.correctOption < 0 || q.correctOption >= q.options.length) {
        return NextResponse.json({ error: 'Đáp án chính xác không hợp lệ' }, { status: 400 });
      }
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: title.trim(),
        description: description || null,
        timeLimit: typeof timeLimit === 'number' ? timeLimit : 15,
        employerId: auth.payload.id,
        questions: {
          create: questions.map((q: any) => ({
            content: q.content.trim(),
            options: q.options,
            correctOption: q.correctOption,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    console.error('Create quiz error:', error);
    return NextResponse.json({ error: 'Không thể tạo bài thi' }, { status: 500 });
  }
}
