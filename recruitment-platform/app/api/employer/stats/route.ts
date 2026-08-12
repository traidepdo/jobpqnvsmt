import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';

export async function GET() {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const companyId = auth.company.id;
  const companyName = auth.company.name;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [
    activeJobs,
    totalApplications,
    todayApplications,
    expiringSoon,
    company,
    recentJobsRaw,
    recentApplicationsRaw,
    upcomingInterviews,
    interviewsRaw,
    candidatesRaw,
    last7DaysApps
  ] = await Promise.all([
    // Tin đang tuyển
    prisma.job.count({
      where: {
        companyId,
        status: 'ACTIVE',
        OR: [
          { deadline: null },
          { deadline: { gte: now } }
        ]
      },
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

    // Tin sắp hết hạn trong 3 ngày
    prisma.job.count({
      where: {
        companyId,
        status: 'ACTIVE',
        deadline: {
          gte: now,
          lte: threeDaysLater,
        },
      },
    }),

    // Trạng thái công ty
    prisma.company.findUnique({
      where: { id: companyId },
      select: { isApproved: true },
    }),

    // Tất cả tin tuyển dụng của doanh nghiệp (phục vụ bộ lọc và tìm kiếm ở client)
    prisma.job.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        deadline: true,
        viewsCount: true,
        _count: { select: { applications: true } },
      },
    }),

    // 10 đơn ứng tuyển mới nhất
    prisma.application.findMany({
      where: { job: { companyId } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        createdAt: true,
        matchScore: true,
        user: { select: { name: true } },
        job: { select: { title: true } },
      },
    }),

    // Lịch phỏng vấn sắp diễn ra (trong tương lai và ở trạng thái SCHEDULED)
    prisma.interview.count({
      where: {
        application: {
          job: { companyId },
        },
        scheduledAt: { gte: now },
        status: 'SCHEDULED',
      },
    }),

    // 5 Lịch phỏng vấn sắp tới chi tiết
    prisma.interview.findMany({
      where: {
        application: {
          job: { companyId },
        },
        scheduledAt: { gte: now },
        status: 'SCHEDULED',
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      select: {
        id: true,
        scheduledAt: true,
        application: {
          select: {
            user: { select: { name: true } },
            job: { select: { title: true } },
          }
        }
      }
    }),

    // Top ứng viên tiềm năng (dựa vào matchScore cao nhất)
    prisma.application.findMany({
      where: {
        job: { companyId },
        matchScore: { not: null },
        status: { not: 'REJECTED' }
      },
      orderBy: { matchScore: 'desc' },
      take: 5,
      select: {
        id: true,
        matchScore: true,
        user: { select: { name: true } },
        job: { select: { title: true } },
      }
    }),

    // Đơn nộp trong 7 ngày gần đây để vẽ biểu đồ
    prisma.application.findMany({
      where: {
        job: { companyId },
        createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
      },
      select: { createdAt: true }
    })
  ]);

  // Xử lý Job format
  const recentJobs = recentJobsRaw.map(j => {
    const isExpired = j.status === 'ACTIVE' && j.deadline && new Date(j.deadline) < now;
    return {
      id: j.id,
      title: j.title,
      slug: j.slug,
      status: isExpired ? 'expired' : j.status.toLowerCase(), // map sang 'active', 'paused', 'expired', v.v.
      applicants: j._count.applications,
      views: j.viewsCount,
      deadline: j.deadline ? new Date(j.deadline).toLocaleDateString('vi-VN') : 'Không có',
      urgent: !isExpired && j.status === 'ACTIVE' && j.deadline && new Date(j.deadline) >= now && new Date(j.deadline) <= threeDaysLater
    };
  });

  // Xử lý Applications format
  const recentApplications = recentApplicationsRaw.map(a => ({
    id: a.id,
    name: a.user.name,
    role: a.job.title,
    date: new Date(a.createdAt).toLocaleDateString('vi-VN'),
    status: a.status.toLowerCase(), // map sang 'pending', 'reviewing', 'accepted', 'rejected'
    score: a.matchScore || 0
  }));

  // Xử lý Lịch phỏng vấn format
  const interviews = interviewsRaw.map(iv => {
    const sDate = new Date(iv.scheduledAt);
    const isToday = sDate.toDateString() === now.toDateString();
    return {
      id: iv.id,
      name: iv.application.user.name,
      role: iv.application.job.title,
      time: sDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      date: isToday ? 'Hôm nay' : sDate.toLocaleDateString('vi-VN')
    };
  });

  // Xử lý Ứng viên tiềm năng format (nếu không có thì fallback sang các ứng tuyển gần nhất)
  let candidates = candidatesRaw.map(c => ({
    id: c.id,
    name: c.user.name,
    role: c.job.title,
    match: c.matchScore || 0
  }));

  if (candidates.length === 0) {
    // Lấy 3 đơn ứng tuyển mới nhất làm gợi ý
    candidates = recentApplicationsRaw.slice(0, 3).map(c => ({
      id: c.id,
      name: c.user.name,
      role: c.job.title,
      match: c.matchScore || 75 // Gán mặc định hoặc ngẫu nhiên nhẹ nếu chưa đánh giá
    }));
  }

  // Xử lý Trend data (7 ngày vừa qua)
  const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const trendData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    const dayLabel = daysOfWeek[d.getDay()];
    const count = last7DaysApps.filter(app => {
      const appDate = new Date(app.createdAt);
      return appDate.getDate() === d.getDate() && appDate.getMonth() === d.getMonth();
    }).length;
    return { day: dayLabel, don: count };
  });

  // Xử lý Phễu tuyển dụng
  const totalViews = recentJobsRaw.reduce((sum, j) => sum + (j.viewsCount || 0), 0);
  const totalApplies = totalApplications;
  const totalInterviews = await prisma.interview.count({
    where: { application: { job: { companyId } } }
  });
  const totalHired = await prisma.application.count({
    where: { job: { companyId }, status: 'ACCEPTED' }
  });

  const funnelData = [
    { stage: "Xem tin", value: totalViews },
    { stage: "Ứng tuyển", value: totalApplies },
    { stage: "Phỏng vấn", value: totalInterviews },
    { stage: "Nhận việc", value: totalHired },
  ];

  return NextResponse.json({
    activeJobs,
    totalApplications,
    todayApplications,
    expiringSoon,
    upcomingInterviews,
    companyApproved: company?.isApproved ?? false,
    companyName,
    recentJobs,
    recentApplications,
    interviews,
    candidates,
    trendData,
    funnelData
  });
}