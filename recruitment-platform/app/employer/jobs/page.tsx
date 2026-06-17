'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatDateVi, formatSalary, getJobStatusLabel } from '@/lib/jobLabels';

interface Job {
  id: string;
  title: string;
  slug: string;
  status: string;
  salaryMin: number | null;
  salaryMax: number | null;
  deadline: string | null;
  category: { name: string };
  ward: { name: string } | null;
  _count: { applications: number };
  isVisible: boolean;
  rejectReason?: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

type FilterTab = { label: string; status?: string; isVisible?: string };

const TABS: FilterTab[] = [
  { label: 'Tất cả' },
  { label: 'Đang hiển thị', status: 'ACTIVE' },
  { label: 'Chờ duyệt', status: 'PENDING' },
  { label: 'Bị từ chối', status: 'REJECTED' },
  { label: 'Nháp', status: 'DRAFT' },
  { label: 'Đã đóng', status: 'CLOSED' },
  { label: 'Bị admin ẩn', isVisible: 'false' },
];

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (tab: FilterTab, p: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab.status) params.set('status', tab.status);
    if (tab.isVisible !== undefined) params.set('isVisible', tab.isVisible);
    params.set('page', String(p));
    params.set('limit', '10');

    fetch(`/api/employer/jobs?${params}`)
      .then(r => r.json())
      .then(d => {
        setJobs(d.jobs || []);
        setPagination(d.pagination || null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(TABS[activeTab], page);
  }, [activeTab, page]);

  const handleTabChange = (idx: number) => {
    setActiveTab(idx);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa tin tuyển dụng này?')) return;
    const res = await fetch(`/api/employer/jobs/${id}`, { method: 'DELETE' });
    if (res.ok) setJobs(j => j.filter(x => x.id !== id));
  };

  const statusStyle: Record<string, string> = {
    ACTIVE: 'bg-green-50 text-green-700',
    PENDING: 'bg-amber-50 text-amber-700',
    DRAFT: 'bg-gray-100 text-gray-600',
    CLOSED: 'bg-gray-100 text-gray-500',
    REJECTED: 'bg-red-50 text-red-700',
  };

  const isHiddenTab = TABS[activeTab].isVisible === 'false';

  return (
    <div className="space-y-6 w-full">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => handleTabChange(idx)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors ${activeTab === idx
              ? tab.isVisible === 'false'
                ? 'bg-orange-500 text-white'
                : 'bg-[#0052CC] text-white'
              : tab.isVisible === 'false'
                ? 'bg-orange-50 border border-orange-200 text-orange-700'
                : 'bg-white border border-gray-200 text-gray-600'
              }`}
          >
            {tab.isVisible === 'false' && <span className="mr-1">🚫</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#0052CC] rounded-full animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed p-12 text-center">
          {isHiddenTab ? (
            <p className="text-gray-500">Không có tin nào bị admin ẩn 🎉</p>
          ) : (
            <>
              <p className="text-gray-500 mb-4">Chưa có tin tuyển dụng</p>
              <Link href="/employer/jobs/new" className="inline-flex px-5 py-2 bg-[#0052CC] text-white font-bold rounded-lg text-sm">
                Đăng tin mới
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {jobs.map(job => (
              <div
                key={job.id}
                className={`bg-white rounded-xl border p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 ${!job.isVisible ? 'border-orange-200 bg-orange-50/40' : 'border-gray-100'
                  }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/jobs/${job.slug}`} target="_blank" className="font-bold text-[#041b3c] hover:text-[#0052CC]">
                      {job.title}
                    </Link>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle[job.status]}`}>
                      {getJobStatusLabel(job.status)}
                    </span>
                    {!job.isVisible && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                        Admin đã ẩn
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {job.category.name} · {formatSalary(job.salaryMin, job.salaryMax)} · {job.ward?.name || 'Phú Quốc'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {job._count.applications} đơn ứng tuyển
                    {job.deadline && ` · Hạn ${formatDateVi(job.deadline)}`}
                  </p>
                  {!job.isVisible && (
                    <p className="text-xs text-orange-600 mt-1.5">
                      ⚠️ Tin này đang bị ẩn khỏi trang tìm kiếm. Vui lòng liên hệ admin để biết thêm chi tiết.
                    </p>
                  )}
                  {job.status === 'REJECTED' && job.rejectReason && (
                    <div className="mt-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-3">
                      <strong>Lý do từ chối:</strong> {job.rejectReason}
                      <p className="mt-1 text-[11px] text-gray-500">
                        Vui lòng nhấn nút <strong>Sửa</strong> để cập nhật lại thông tin tuyển dụng.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/employer/jobs/${job.id}/edit`} className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">
                    Sửa
                  </Link>
                  <button onClick={() => handleDelete(job.id)} className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer">
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">
                {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} tin
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Trước
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`dots-${i}`} className="px-2 py-1.5 text-sm text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-lg border ${pagination.page === p
                          ? 'bg-[#0052CC] text-white border-[#0052CC]'
                          : 'border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Tiếp →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}