'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatDateVi, formatSalary, getApplicationStatusLabel } from '@/lib/jobLabels';

interface Stats {
  applications: number;
  savedJobs: number;
  resumes: number;
  pending: number;
  reviewing: number;
  accepted: number;
}

interface Application {
  id: string;
  status: string;
  createdAt: string;
  job: {
    title: string;
    slug: string;
    company: { name: string; logo: string | null };
  };
}

export default function CandidateDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/candidate/stats').then(r => r.json()),
      fetch('/api/candidate/applications').then(r => r.json()),
    ])
      .then(([statsData, appsData]) => {
        setStats(statsData);
        setRecentApps((appsData.applications || []).slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Đã ứng tuyển', value: stats?.applications ?? 0, icon: 'description', color: '#6366f1' },
    { label: 'Việc đã lưu', value: stats?.savedJobs ?? 0, icon: 'bookmark', color: '#ef4444' },
    { label: 'CV đã tạo', value: stats?.resumes ?? 0, icon: 'article', color: '#00b14f' },
    { label: 'Được chấp nhận', value: stats?.accepted ?? 0, icon: 'check_circle', color: '#10b981' },
  ];

  const statusStyle: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700',
    REVIEWING: 'bg-indigo-50 text-indigo-700',
    ACCEPTED: 'bg-green-50 text-green-700',
    REJECTED: 'bg-red-50 text-red-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="bg-gradient-to-r from-[#00b14f] to-[#009940] rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-1">Chào mừng trở lại!</h2>
        <p className="text-white/80 text-sm mb-5">Quản lý CV, đơn ứng tuyển và việc làm đã lưu tại một nơi.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/jobs" className="px-4 py-2 bg-white text-[#00b14f] font-bold rounded-lg text-sm hover:bg-white/90">
            Tìm việc làm
          </Link>
          <Link href="/tao-cv" className="px-4 py-2 bg-white/20 border border-white/40 font-bold rounded-lg text-sm hover:bg-white/30">
            Tạo CV mới
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <span className="material-symbols-outlined text-[28px] mb-2" style={{ color: card.color }}>
              {card.icon}
            </span>
            <p className="text-2xl font-extrabold text-[#041b3c]">{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-[#041b3c]">Đơn ứng tuyển gần đây</h3>
            <Link href="/candidate/applications" className="text-sm font-semibold text-[#00b14f] hover:underline">
              Xem tất cả
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Chưa có đơn ứng tuyển.{' '}
              <Link href="/jobs" className="text-[#00b14f] font-semibold">Tìm việc ngay</Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentApps.map(app => (
                <li key={app.id}>
                  <Link href={`/jobs/${app.job.slug}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                    <img
                      src={app.job.company.logo || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=48'}
                      alt=""
                      className="w-10 h-10 rounded-lg object-contain border bg-gray-50"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#041b3c] truncate">{app.job.title}</p>
                      <p className="text-xs text-gray-400">{app.job.company.name} · {formatDateVi(app.createdAt)}</p>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${statusStyle[app.status] || ''}`}>
                      {getApplicationStatusLabel(app.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-[#041b3c] mb-4">Truy cập nhanh</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { href: '/candidate/resumes', icon: 'article', label: 'CV đã tạo', desc: `${stats?.resumes ?? 0} hồ sơ` },
              { href: '/candidate/saved', icon: 'bookmark', label: 'Việc đã lưu', desc: `${stats?.savedJobs ?? 0} tin` },
              { href: '/candidate/applications', icon: 'description', label: 'Đơn ứng tuyển', desc: `${stats?.applications ?? 0} đơn` },
              { href: '/tao-cv', icon: 'add_circle', label: 'Tạo CV mới', desc: 'Mẫu chuyên nghiệp' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#00b14f]/40 hover:bg-[#00b14f]/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[#00b14f]">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[#041b3c]">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
