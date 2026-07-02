import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const { id } = await params;
  
  // Verify application belongs to employer's company
  const application = await prisma.application.findFirst({
    where: { id, job: { companyId: auth.company.id } },
    include: {
      user: { select: { name: true, email: true } },
    }
  });

  if (!application) {
    return NextResponse.json({ error: 'Không tìm thấy đơn ứng tuyển' }, { status: 404 });
  }

  try {
    const { subject, body } = await req.json();

    if (!subject || !body) {
      return NextResponse.json({ error: 'Tiêu đề và nội dung thư không được để trống' }, { status: 400 });
    }

    // 1. Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { applicationId: id },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          applicationId: id,
          employerId: auth.payload.id,
          candidateId: application.userId,
        },
      });
    }

    // 2. Create in-app message
    const formattedContent = `**Tiêu đề: ${subject}**\n\n${body}`;
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: auth.payload.id,
        content: formattedContent,
      },
    });

    return NextResponse.json({ success: true, message: 'Đã gửi tin nhắn thành công!' });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Không thể gửi tin nhắn' }, { status: 500 });
  }
}
