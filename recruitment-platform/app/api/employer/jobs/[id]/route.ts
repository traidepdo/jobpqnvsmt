import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';
import { JobLevel, JobType, ExperienceLevel } from '@prisma/client';

async function getOwnedJob(companyId: string, jobId: string) {
  return prisma.job.findFirst({
    where: { id: jobId, companyId },
    include: {
      category: { select: { id: true, name: true } },
      ward: { select: { id: true, name: true } },
      _count: { select: { applications: true } },
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const { id } = await params;
  const job = await getOwnedJob(auth.company.id, id);
  if (!job) {
    return NextResponse.json({ error: 'Không tìm thấy tin tuyển dụng' }, { status: 404 });
  }

  return NextResponse.json({ job });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const { id } = await params;
  const existing = await getOwnedJob(auth.company.id, id);
  if (!existing) {
    return NextResponse.json({ error: 'Không tìm thấy tin tuyển dụng' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      requirements,
      benefits,
      quantity,
      salaryMin,
      salaryMax,
      wardId,
      addressDetail,
      type,
      experience,
      level,
      deadline,
      categoryId,
      status,
      quizId,
      latitude,
      longitude,
    } = body;

    const isDraftOrClosed = status === 'DRAFT' || status === 'CLOSED' || (status === undefined && (existing.status === 'DRAFT' || existing.status === 'CLOSED'));
    const finalStatus = isDraftOrClosed ? (status || existing.status) : 'PROCESSING';

    const job = await prisma.job.update({
      where: { id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description && { description: description.trim() }),
        requirements: requirements ?? undefined,
        benefits: benefits ?? undefined,
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(salaryMin !== undefined && { salaryMin: salaryMin ? Number(salaryMin) : null }),
        ...(salaryMax !== undefined && { salaryMax: salaryMax ? Number(salaryMax) : null }),
        wardId: wardId ?? undefined,
        addressDetail: addressDetail ?? undefined,
        ...(type && { type: type as JobType }),
        ...(experience !== undefined && { experience: (experience || null) as ExperienceLevel | null }),
        ...(level !== undefined && { level: (level || null) as JobLevel | null }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(categoryId && { categoryId }),
        status: finalStatus,
        ...(finalStatus === 'PROCESSING' && { rejectReason: null }),
        quizId: quizId !== undefined ? (quizId || null) : undefined,
        latitude: latitude !== undefined ? (latitude !== null && latitude !== '' ? Number(latitude) : null) : undefined,
        longitude: longitude !== undefined ? (longitude !== null && longitude !== '' ? Number(longitude) : null) : undefined,
      },
      include: {
        category: { select: { id: true, name: true } },
        ward: { select: { id: true, name: true } },
      },
    });

    // Kích hoạt Celery kiểm duyệt lại khi tin ở trạng thái PROCESSING
    if (finalStatus === 'PROCESSING') {
      const djangoUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000';
      fetch(`${djangoUrl}/api/jobs/moderate/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || ""}`
        },
        body: JSON.stringify({ job_id: job.id }),
      }).catch(err => {
        console.error('Failed to trigger Django Celery moderation task on update:', err);
      });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Update job error:', error);
    return NextResponse.json({ error: 'Không thể cập nhật tin' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const { id } = await params;
  const existing = await getOwnedJob(auth.company.id, id);
  if (!existing) {
    return NextResponse.json({ error: 'Không tìm thấy tin tuyển dụng' }, { status: 404 });
  }

  try {
    // 1. Tìm các đơn ứng tuyển liên quan đến tin tuyển dụng này
    const applications = await prisma.application.findMany({
      where: { jobId: id },
      select: { id: true },
    });
    const appIds = applications.map(a => a.id);

    // 2. Tìm các cuộc hội thoại liên quan đến các đơn ứng tuyển
    const conversations = await prisma.conversation.findMany({
      where: { applicationId: { in: appIds } },
      select: { id: true },
    });
    const convIds = conversations.map(c => c.id);

    // 3. Thực hiện xóa tuần tự theo chuỗi phụ thuộc trong Transaction
    await prisma.$transaction([
      // Xóa tất cả tin nhắn trong các cuộc hội thoại của tin tuyển dụng này
      prisma.message.deleteMany({
        where: { conversationId: { in: convIds } },
      }),
      // Xóa các cuộc hội thoại
      prisma.conversation.deleteMany({
        where: { id: { in: convIds } },
      }),
      // Xóa các buổi phỏng vấn của các đơn ứng tuyển
      prisma.interview.deleteMany({
        where: { applicationId: { in: appIds } },
      }),
      // Xóa các đơn ứng tuyển
      prisma.application.deleteMany({
        where: { id: { in: appIds } },
      }),
      // Xóa các lượt lưu tin tuyển dụng này của ứng viên
      prisma.savedJob.deleteMany({
        where: { jobId: id },
      }),
      // Xóa các thẻ liên kết với công việc
      prisma.jobTag.deleteMany({
        where: { jobId: id },
      }),
      // Xóa dữ liệu nhúng (embedding) của công việc
      prisma.jobEmbedding.deleteMany({
        where: { jobId: id },
      }),
      // Cuối cùng là xóa tin tuyển dụng
      prisma.job.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete job error:', error);
    return NextResponse.json(
      { error: 'Không thể xóa tin tuyển dụng. Vui lòng thử lại sau.' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const { id } = await params;
  const existing = await getOwnedJob(auth.company.id, id);
  if (!existing) {
    return NextResponse.json({ error: 'Không tìm thấy tin tuyển dụng' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { deadline } = body;

    if (!deadline) {
      return NextResponse.json({ error: 'Thiếu ngày gia hạn' }, { status: 400 });
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        deadline: new Date(deadline),
        ...(existing.status === 'ACTIVE' && { status: 'ACTIVE' }),
      },
      include: {
        category: { select: { id: true, name: true } },
        ward: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Patch job error:', error);
    return NextResponse.json({ error: 'Không thể gia hạn tin đăng' }, { status: 500 });
  }
}

