import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCandidate } from '@/lib/requireCandidate';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          select: {
            id: true,
            content: true,
            options: true,
            // Exclude correctOption for candidate security!
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Không tìm thấy bài thi' }, { status: 404 });
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Fetch secure quiz detail error:', error);
    return NextResponse.json({ error: 'Không thể tải chi tiết bài thi' }, { status: 500 });
  }
}
