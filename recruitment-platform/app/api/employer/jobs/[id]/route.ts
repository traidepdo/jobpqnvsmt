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

    const targetStatus = status
      ? (status === 'DRAFT' ? 'DRAFT' : status === 'CLOSED' ? 'CLOSED' : 'PENDING')
      : undefined;

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
        ...(targetStatus && { status: targetStatus }),
        ...(targetStatus === 'PENDING' && { rejectReason: null }),
        quizId: quizId !== undefined ? (quizId || null) : undefined,
        latitude: latitude !== undefined ? (latitude !== null && latitude !== '' ? Number(latitude) : null) : undefined,
        longitude: longitude !== undefined ? (longitude !== null && longitude !== '' ? Number(longitude) : null) : undefined,
      },
      include: {
        category: { select: { id: true, name: true } },
        ward: { select: { id: true, name: true } },
      },
    });

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

  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
