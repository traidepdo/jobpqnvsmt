import React from 'react';
import { requireCandidate } from '@/lib/requireCandidate';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { formatDateVi } from '@/lib/jobLabels';

interface TimelineItem {
  id: string;
  type: 'apply' | 'save' | 'resume';
  title: string;
  subtitle: string;
  date: Date;
  icon: string;
  color: string;
}

export default async function RecentActivities() {
  const authResult = await requireCandidate();
  if (authResult.error) {
    redirect('/login');
  }
  const userId = authResult.payload.id;

  // Fetch applications, saved jobs, and resumes
  const [apps, saved, resumes] = await Promise.all([
    prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: { job: { include: { company: true } } },
    }),
    prisma.savedJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: { job: { include: { company: true } } },
    }),
    prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ]);

  // Combine and sort
  const timeline: TimelineItem[] = [];

  apps.forEach((app) => {
    timeline.push({
      id: `app-${app.id}`,
      type: 'apply',
      title: `Đã nộp đơn ứng tuyển`,
      subtitle: `Vị trí ${app.job.title} tại ${app.job.company.name}`,
      date: app.createdAt,
      icon: 'send',
      color: '#00b14f',
    });
  });

  saved.forEach((sj) => {
    timeline.push({
      id: `save-${sj.id}`,
      type: 'save',
      title: `Đã lưu việc làm`,
      subtitle: `Vị trí ${sj.job.title} tại ${sj.job.company.name}`,
      date: sj.createdAt,
      icon: 'bookmark',
      color: '#ef4444',
    });
  });

  resumes.forEach((res) => {
    timeline.push({
      id: `res-${res.id}`,
      type: 'resume',
      title: `Đã cập nhật hồ sơ/CV`,
      subtitle: `Hồ sơ: ${res.title}`,
      date: res.createdAt,
      icon: 'badge',
      color: '#6366f1',
    });
  });

  // Sort by date desc
  const sortedTimeline = timeline
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-slate-200 transition-all duration-300">
      <h3 className="font-bold text-[#041b3c] mb-5 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[#00b14f] text-[20px]">history</span>
        Hoạt động gần đây
      </h3>

      {sortedTimeline.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          Chưa có hoạt động nào được ghi nhận.
        </div>
      ) : (
        <div className="relative pl-6 border-l border-slate-100 space-y-6">
          {sortedTimeline.map((item) => (
            <div key={item.id} className="relative">
              {/* Timeline dot/icon */}
              <div
                className="absolute -left-[37px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                style={{ backgroundColor: `${item.color}15`, color: item.color }}
              >
                <span className="material-symbols-outlined text-[15px] font-bold">{item.icon}</span>
              </div>

              {/* Content */}
              <div>
                <p className="text-xs font-bold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                  {formatDateVi(item.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
