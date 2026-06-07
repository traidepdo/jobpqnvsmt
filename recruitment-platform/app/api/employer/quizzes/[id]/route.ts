import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Không tìm thấy bài thi' }, { status: 404 });
    }

    if (quiz.employerId !== auth.payload.id) {
      return NextResponse.json({ error: 'Bạn không có quyền xem bài thi này' }, { status: 403 });
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Fetch quiz detail error:', error);
    return NextResponse.json({ error: 'Không thể tải chi tiết bài thi' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Không tìm thấy bài thi' }, { status: 404 });
    }

    if (quiz.employerId !== auth.payload.id) {
      return NextResponse.json({ error: 'Bạn không có quyền chỉnh sửa bài thi này' }, { status: 403 });
    }

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

    // Perform transaction: update quiz details, delete old questions, create new questions
    const updatedQuiz = await prisma.$transaction(async (tx) => {
      // Delete old questions
      await tx.question.deleteMany({
        where: { quizId: id },
      });

      // Update quiz and recreate questions
      return await tx.quiz.update({
        where: { id },
        data: {
          title: title.trim(),
          description: description || null,
          timeLimit: typeof timeLimit === 'number' ? timeLimit : 15,
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
    });

    return NextResponse.json({ quiz: updatedQuiz });
  } catch (error) {
    console.error('Update quiz error:', error);
    return NextResponse.json({ error: 'Không thể cập nhật bài thi' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Không tìm thấy bài thi' }, { status: 404 });
    }

    if (quiz.employerId !== auth.payload.id) {
      return NextResponse.json({ error: 'Bạn không có quyền xóa bài thi này' }, { status: 403 });
    }

    await prisma.quiz.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Đã xóa bài thi thành công' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    return NextResponse.json({ error: 'Không thể xóa bài thi' }, { status: 500 });
  }
}
