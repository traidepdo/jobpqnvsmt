import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';
import { slugify } from '@/lib/slugify';
import { JobLevel, JobType, ExperienceLevel, JobStatus } from '@prisma/client';

export async function GET(req: Request) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';
  const isVisible = searchParams.get('isVisible') || '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(20, Number(searchParams.get('limit')) || 10);
  const skip = (page - 1) * limit;

  const where = {
    companyId: auth.company.id,
    ...(status && { status: status as JobStatus }),
    ...(isVisible === 'true' && { isVisible: true }),
    ...(isVisible === 'false' && { isVisible: false }),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        category: { select: { name: true } },
        ward: { select: { name: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return NextResponse.json({
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}

export async function POST(req: Request) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  if (!auth.company.isApproved) {
    return NextResponse.json(
      { error: 'Công ty chưa được duyệt. Vui lòng chờ admin phê duyệt trước khi đăng tin.' },
      { status: 403 },
    );
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
      status: jobStatus,
    } = body;

    if (!title?.trim() || !description?.trim() || !categoryId) {
      return NextResponse.json({ error: 'Vui lòng điền tiêu đề, mô tả và ngành nghề' }, { status: 400 });
    }

    const status: JobStatus =
      jobStatus === 'DRAFT' ? 'DRAFT' : 'PENDING';

    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        slug: slugify(title.trim()),
        description: description.trim(),
        requirements: requirements || null,
        benefits: benefits || null,
        quantity: quantity ? Number(quantity) : 1,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        wardId: wardId || null,
        addressDetail: addressDetail || null,
        type: (type as JobType) || 'FULL_TIME',
        experience: (experience as ExperienceLevel) || null,
        level: (level as JobLevel) || null,
        deadline: deadline ? new Date(deadline) : null,
        categoryId,
        companyId: auth.company.id,
        status,
      },
      include: {
        category: { select: { name: true } },
        ward: { select: { name: true } },
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json({ error: 'Không thể tạo tin tuyển dụng' }, { status: 500 });
  }
}