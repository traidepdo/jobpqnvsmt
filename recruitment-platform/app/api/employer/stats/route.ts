import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';

export async function GET() {
  const auth = await requireEmployer();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const companyId = auth.company.id;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    activeJobs,
    totalApplications,
    todayApplications,
    expiringSoon,
    company,
    recentJobs,
    recentApplications,
  ] = await Promise.all([
    // Tin đang tuyển
    prisma.job.count({
      where: { companyId, status: 'ACTIVE' },
    }),

    // Tổng đơn ứng tuyển
    prisma.application.count({
      where: { job: { companyId } },
    }),

    // Đơn mới hôm nay
    prisma.application.count({
      where: {
        job: { companyId },
        createdAt: { gte: todayStart },
      },
    }),

    // Tin sắp hết hạn trong 7 ngày
    prisma.job.count({
      where: {
        companyId,
        status: 'ACTIVE',
        deadline: {
          gte: now,
          lte: sevenDaysLater,
        },
      },
    }),

    // Trạng thái công ty
    prisma.company.findUnique({
      where: { id: companyId },
      select: { isApproved: true },
    }),

    // 5 tin tuyển dụng gần nhất
    prisma.job.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        deadline: true,
        _count: { select: { applications: true } },
      },
    }),

    // 5 đơn ứng tuyển mới nhất
    prisma.application.findMany({
      where: { job: { companyId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: { select: { name: true } },
        job: { select: { title: true } },
      },
    }),
  ]);

  return NextResponse.json({
    activeJobs,
    totalApplications,
    todayApplications,
    expiringSoon,
    companyApproved: company?.isApproved ?? false,
    recentJobs,
    recentApplications,
  });
}