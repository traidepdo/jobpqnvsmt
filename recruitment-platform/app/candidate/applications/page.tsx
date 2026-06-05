'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatSalary } from '@/lib/jobLabels';

interface Application {
  id: string;
  status: string;
  coverLetter: string | null;
  createdAt: string;
  job: {
    id: string;
    title: string;
    slug: string;
    salaryMin: number | null;
    salaryMax: number | null;
    company: { name: string; logo: string | null };
    category: { name: string };
  };
  resume: { id: string; title: string } | null;
}

// ─── Status config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  PENDING: { label: 'Chờ xem xét', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
  REVIEWING: { label: 'Đang xem xét', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  INTERVIEW: { label: 'Phỏng vấn', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  ACCEPTED: { label: 'Đã nhận', color: 'text-green-600', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
  REJECTED: { label: 'Không phù hợp', color: 'text-red-500', bg: 'bg-red-50 border-red-200', dot: 'bg-red-400' },
};

const ALL_STATUSES = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ xem xét', value: 'PENDING' },
  { label: 'Đang xem xét', value: 'REVIEWING' },
  { label: 'Phỏng vấn', value: 'INTERVIEW' },
  { label: 'Đã nhận', value: 'ACCEPTED' },
  { label: 'Không phù hợp', value: 'REJECTED' },
];

// ─── Status badge ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="font-semibold text-gray-700 text-base mb-1">
        {filtered ? 'Không có đơn nào với trạng thái này' : 'Bạn chưa ứng tuyển công việc nào'}
      </p>
      <p className="text-sm text-gray-400 mb-5">
        {filtered ? 'Thử chọn trạng thái khác' : 'Hãy tìm kiếm và ứng tuyển ngay hôm nay!'}
      </p>
      {!filtered && (
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 bg-[#00b14f] hover:bg-[#009940] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Tìm việc làm
        </Link>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════

export default function AppliedJobsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/candidate/applications')
      .then(r => r.json())
      .then(d => setApplications(d.applications || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterStatus
    ? applications.filter(a => a.status === filterStatus)
    : applications;

  const counts = ALL_STATUSES.slice(1).reduce<Record<string, number>>((acc, s) => {
    acc[s.value] = applications.filter(a => a.status === s.value).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#f4f6f5] pt-20 pb-16">
      <div className="max-w-[900px] mx-auto px-4 md:px-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-5">
          <Link href="/" className="hover:text-[#00b14f] transition-colors">Trang chủ</Link>
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#00b14f] font-medium">Việc làm đã ứng tuyển</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Việc làm đã ứng tuyển</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {loading ? 'Đang tải...' : `${applications.length} đơn ứng tuyển`}
            </p>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 bg-[#00b14f] hover:bg-[#009940] text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Tìm thêm việc làm
          </Link>
        </div>

        {/* Stats row */}
        {!loading && applications.length > 0 && (
          <div className="grid grid-cols-5 gap-2.5 mb-5">
            {ALL_STATUSES.slice(1).map(s => {
              const cfg = STATUS_CONFIG[s.value];
              return (
                <button
                  key={s.value}
                  onClick={() => setFilterStatus(filterStatus === s.value ? '' : s.value)}
                  className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${filterStatus === s.value ? cfg.bg + ' ' + cfg.color : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                >
                  <p className={`text-xl font-bold ${filterStatus === s.value ? cfg.color : 'text-gray-800'}`}>
                    {counts[s.value] || 0}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${filterStatus === s.value ? cfg.color : 'text-gray-500'}`}>
                    {s.label}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Filter tabs */}
        {!loading && applications.length > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {ALL_STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => setFilterStatus(s.value)}
                className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all cursor-pointer border ${filterStatus === s.value
                  ? 'bg-[#00b14f] text-white border-[#00b14f]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#00b14f] hover:text-[#00b14f]'
                  }`}
              >
                {s.label}
                {s.value && counts[s.value] > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filterStatus === s.value ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {counts[s.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Đang tải đơn ứng tuyển...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100">
            <EmptyState filtered={!!filterStatus} />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(app => {
              const expanded = expandedId === app.id;
              return (
                <div
                  key={app.id}
                  className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all overflow-hidden"
                >
                  {/* Main row */}
                  <div className="p-4">
                    <div className="flex gap-3.5">
                      {/* Logo */}
                      <div className="w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {app.job.company.logo ? (
                          <img src={app.job.company.logo} alt={app.job.company.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#00b14f]/10 to-[#00b14f]/20 flex items-center justify-center">
                            <span className="text-[#00b14f] font-bold text-lg">{app.job.company.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="min-w-0">
                            <Link
                              href={`/jobs/${app.job.slug}`}
                              className="text-[14px] font-bold text-gray-900 hover:text-[#00b14f] transition-colors line-clamp-1"
                            >
                              {app.job.title}
                            </Link>
                            <p className="text-[12px] font-medium text-[#00b14f] mt-0.5">{app.job.company.name}</p>
                          </div>
                          <StatusBadge status={app.status} />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatSalary(app.job.salaryMin, app.job.salaryMax)}
                          </span>

                          <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                            {app.job.category.name}
                          </span>

                          {app.resume && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {app.resume.title}
                            </span>
                          )}

                          <span className="text-[11px] text-gray-400 ml-auto">
                            Nộp {new Date(app.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expand toggle */}
                    {app.coverLetter && (
                      <button
                        onClick={() => setExpandedId(expanded ? null : app.id)}
                        className="mt-3 ml-[3.875rem] flex items-center gap-1 text-[12px] text-gray-400 hover:text-[#00b14f] transition-colors cursor-pointer"
                      >
                        <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {expanded ? 'Ẩn thư xin việc' : 'Xem thư xin việc'}
                      </button>
                    )}
                  </div>

                  {/* Cover letter expand */}
                  {expanded && app.coverLetter && (
                    <div className="px-4 pb-4 pt-0 ml-[3.875rem] border-t border-gray-50">
                      <div className="mt-3 bg-gray-50 rounded-lg p-3.5">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Thư xin việc</p>
                        <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">{app.coverLetter}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}