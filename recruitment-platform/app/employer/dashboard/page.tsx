'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatDateVi, getApplicationStatusLabel, getJobStatusLabel } from '@/lib/jobLabels';

type DashboardData = {
  activeJobs: number;
  totalApplications: number;
  todayApplications: number;
  expiringSoon: number;
  upcomingInterviews: number;
  companyApproved: boolean;
  recentJobs: {
    id: string;
    title: string;
    slug: string;
    status: string;
    deadline: string | null;
    _count: { applications: number };
  }[];
  recentApplications: {
    id: string;
    status: string;
    createdAt: string;
    user: { name: string };
    job: { title: string };
  }[];
};

const statusStyle: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
  REVIEWING: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  ACCEPTED: 'bg-green-50 text-green-700 border-green-100',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
  ACTIVE: 'bg-green-50 text-green-700 border-green-100',
  DRAFT: 'bg-gray-100 text-gray-500 border-gray-200',
  CLOSED: 'bg-gray-100 text-gray-400 border-gray-200',
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-100 animate-pulse rounded-lg ${className}`} />;
}

function StatCard({ label, value, icon, color, href }: {
  label: string; value: number; icon: string; color: string; href?: string;
}) {
  const content = (
    <>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-extrabold text-[#041b3c]">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </>
  );

  const className = `bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-start gap-4 transition-all duration-200 ${
    href ? 'hover:shadow-md hover:border-blue-200 hover:scale-[1.02] cursor-pointer' : ''
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}

export default function EmployerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/employer/stats')
      .then(r => {
        if (!r.ok) throw new Error('Unauthorized or server error');
        return r.json();
      })
      .then(setData)
      .catch(err => {
        console.error(err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="material-symbols-outlined text-[48px] text-gray-300 mb-3">error_outline</span>
        <p className="font-semibold text-gray-500">Không tải được dữ liệu</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-[#0052CC] text-white text-sm font-semibold rounded-lg hover:bg-[#0040a2] transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Banner chờ duyệt */}
      {!data.companyApproved && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
          <span className="material-symbols-outlined text-amber-500 flex-shrink-0">info</span>
          <div>
            <p className="font-semibold text-amber-900 text-sm">Công ty đang chờ phê duyệt</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Sau khi admin duyệt, bạn có thể đăng tin tuyển dụng công khai.
            </p>
          </div>
        </div>
      )}

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-[#0052CC] to-[#0747A6] rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Xin chào! 👋</h2>
          <p className="text-white/80 text-sm mt-1">
            Hôm nay có <strong className="text-white">{data.todayApplications}</strong> đơn mới ·{' '}
            <strong className="text-white">{data.expiringSoon}</strong> tin sắp hết hạn
          </p>
        </div>
        <Link
          href="/employer/jobs/new"
          className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0052CC] font-bold text-sm rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Đăng tin mới
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Tin đang tuyển" value={data.activeJobs} icon="work" color="bg-blue-50 text-[#0052CC]" href="/employer/jobs" />
        <StatCard label="Tổng đơn ứng tuyển" value={data.totalApplications} icon="inbox" color="bg-indigo-50 text-indigo-600" href="/employer/applications" />
        <StatCard label="Đơn mới hôm nay" value={data.todayApplications} icon="mark_email_unread" color="bg-green-50 text-green-600" href="/employer/applications?status=PENDING" />
        <StatCard label="Lịch phỏng vấn sắp tới" value={data.upcomingInterviews} icon="calendar_today" color="bg-purple-50 text-purple-600" href="/employer/interviews" />
        <StatCard label="Tin sắp hết hạn" value={data.expiringSoon} icon="schedule" color="bg-amber-50 text-amber-600" href="/employer/jobs" />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent jobs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-[#041b3c]">Tin tuyển dụng gần đây</h3>
            <Link href="/employer/jobs" className="text-xs font-semibold text-[#0052CC] hover:underline">
              Xem tất cả
            </Link>
          </div>
          {data.recentJobs.length === 0 ? (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-[36px] text-gray-200 block mb-2">work_off</span>
              <p className="text-sm text-gray-400">Chưa có tin tuyển dụng nào</p>
              <Link
                href="/employer/jobs/new"
                className="inline-block mt-3 text-xs font-semibold text-[#0052CC] hover:underline"
              >
                Đăng tin đầu tiên →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {data.recentJobs.map(j => (
                <li key={j.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/employer/jobs/${j.id}/edit`}
                      className="font-semibold text-sm text-[#041b3c] hover:text-[#0052CC] truncate transition-colors"
                    >
                      {j.title}
                    </Link>
                    <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle[j.status]}`}>
                      {getJobStatusLabel(j.status)}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">description</span>
                      {j._count.applications} đơn
                    </span>
                    {j.deadline && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">event</span>
                        Hạn {formatDateVi(j.deadline)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent applications */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-[#041b3c]">Đơn ứng tuyển mới</h3>
            <Link href="/employer/applications" className="text-xs font-semibold text-[#0052CC] hover:underline">
              Xem tất cả
            </Link>
          </div>
          {data.recentApplications.length === 0 ? (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-[36px] text-gray-200 block mb-2">inbox</span>
              <p className="text-sm text-gray-400">Chưa có đơn ứng tuyển nào</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {data.recentApplications.map(a => (
                <li key={a.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0052CC] to-indigo-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {a.user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#041b3c] truncate">{a.user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{a.job.title} · {formatDateVi(a.createdAt)}</p>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle[a.status]}`}>
                    {getApplicationStatusLabel(a.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}