import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';
import { ApplicationStatus } from '@prisma/client';

const VALID: ApplicationStatus[] = ['PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED'];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const { id } = await params;
  const application = await prisma.application.findFirst({
    where: { id, job: { companyId: auth.company.id } },
  });

  if (!application) {
    return NextResponse.json({ error: 'Không tìm thấy đơn ứng tuyển' }, { status: 404 });
  }

  try {
    const { status, isBookmarked } = await req.json();

    if (status && !VALID.includes(status)) {
      return NextResponse.json({ error: 'Trạng thái không hợp lệ' }, { status: 400 });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(isBookmarked !== undefined && { isBookmarked }),
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        job: { select: { title: true } },
        resume: { select: { id: true, title: true, summary: true, education: true, experience: true } },
      },
    });

    // Nếu chuyển sang ACCEPTED → tạo conversation nếu chưa có
    let conversationId: string | null = null;
    if (status === 'ACCEPTED') {
      const existing = await prisma.conversation.findFirst({
        where: { applicationId: id },
      });

      if (existing) {
        conversationId = existing.id;
      } else {
        const conv = await prisma.conversation.create({
          data: {
            applicationId: id,
            employerId: auth.payload.id,   // hoặc auth.company.id tuỳ schema
            candidateId: updated.userId,
          },
        });
        conversationId = conv.id;
      }
    }

    return NextResponse.json({ application: updated, conversationId });
  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json({ error: 'Không thể cập nhật đơn' }, { status: 500 });
  }
}