'use client';

import React from 'react';
import Link from 'next/link';
import { formatSalary } from '@/lib/jobLabels';
import { JobDetails } from '@/components/jobs/JobDetailsClient';

interface JobDetailHeaderProps {
  job: JobDetails;
  salaryAnalysis: {
    predictedSalary: number;
    actualSalary: number | null;
    status: 'good' | 'average' | 'bad';
    percentageDiff: number;
    comparisonMessage: string;
  } | null;
  isSaved: boolean;
  saveLoading: boolean;
  isApplied: boolean;
  isPendingOrReviewing: boolean;
  applyLoading: boolean;
  onToggleSave: () => void;
  onApplyClick: () => void;
  onCancelClick: () => void;
}

const getJobTypeLabel = (type?: string) => {
  switch (type) {
    case 'FULL_TIME': return 'Toàn thời gian';
    case 'PART_TIME': return 'Bán thời gian';
    case 'CONTRACT': return 'Hợp đồng';
    case 'INTERNSHIP': return 'Thực tập';
    case 'REMOTE': return 'Từ xa';
    default: return type || '';
  }
};

const getExperienceLabel = (exp?: string | null) => {
  switch (exp) {
    case 'NO_EXPERIENCE': return 'Không yêu cầu';
    case 'UNDER_1_YEAR': return 'Dưới 1 năm';
    case 'ONE_TO_THREE_YEARS': return '1 – 3 năm';
    case 'THREE_TO_FIVE_YEARS': return '3 – 5 năm';
    case 'OVER_FIVE_YEARS': return 'Trên 5 năm';
    default: return 'Không yêu cầu';
  }
};

export default function JobDetailHeader({
  job,
  salaryAnalysis,
  isSaved,
  saveLoading,
  isApplied,
  isPendingOrReviewing,
  applyLoading,
  onToggleSave,
  onApplyClick,
  onCancelClick,
}: JobDetailHeaderProps) {
  return (
    <>
      {/* ── Hero Banner ─────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-4 pb-6">
          {/* Visual Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#00b14f] transition-colors">Trang chủ</Link>
            <span className="material-symbols-outlined text-[13px] text-gray-300">chevron_right</span>
            <Link href="/jobs" className="hover:text-[#00b14f] transition-colors">Việc làm</Link>
            <span className="material-symbols-outlined text-[13px] text-gray-300">chevron_right</span>
            <Link href={`/jobs?category=${job.category.slug}`} className="hover:text-[#00b14f] transition-colors">
              {job.category.name}
            </Link>
            <span className="material-symbols-outlined text-[13px] text-gray-300">chevron_right</span>
            <span className="text-gray-500 font-medium truncate max-w-[200px] md:max-w-[300px]" title={job.title}>
              {job.title}
            </span>
          </nav>

          <div className="flex gap-4 items-start">
            {/* Logo */}
            <div className="w-14 h-14 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {job.company.logo ? (
                <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-contain p-1.5" />
              ) : (
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M8 10h2m-2 4h2m4-4h2m-2 4h2" strokeWidth={1.5} strokeLinecap="round" />
                </svg>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                  {job.category.name}
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {getJobTypeLabel(job.type)}
                </span>
                {salaryAnalysis && (
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${salaryAnalysis.status === 'good'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : salaryAnalysis.status === 'bad'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`} title={salaryAnalysis.comparisonMessage}>
                    <span>
                      {salaryAnalysis.status === 'good' ? '✨' : salaryAnalysis.status === 'bad' ? '⚠️' : 'ℹ️'}
                    </span>
                    <span>
                      {salaryAnalysis.status === 'good'
                        ? `Lương tốt (+${Math.abs(salaryAnalysis.percentageDiff)}%)`
                        : salaryAnalysis.status === 'bad'
                          ? `Lương thấp hơn trung bình (-${Math.abs(salaryAnalysis.percentageDiff)}%)`
                          : 'Lương cạnh tranh'}
                    </span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-snug mb-0.5">{job.title}</h1>

              {/* Company */}
              <Link href={`/companies/${job.company.slug}`} className="text-sm font-semibold text-[#00b14f] hover:underline">
                {job.company.name}
              </Link>

              {/* Meta */}
              <div className="flex flex-wrap gap-3 mt-2.5 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {job.ward?.name || 'Phú Quốc'}
                </span>
                {job.deadline && (
                  <span className="flex items-center gap-1" suppressHydrationWarning>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Hạn: {new Date(job.deadline).toLocaleDateString('vi-VN')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {job.quantity} vị trí
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
              {!isApplied ? (
                <button
                  onClick={onApplyClick}
                  className="apply-btn bg-[#00b14f] hover:bg-[#009940] text-white font-semibold text-sm px-5 py-2.5 rounded-xl cursor-pointer hidden md:block"
                >
                  Ứng tuyển ngay
                </button>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <button className="apply-btn bg-gray-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl cursor-not-allowed">
                    Đã ứng tuyển
                  </button>
                  {isPendingOrReviewing && (
                    <button
                      onClick={onCancelClick}
                      disabled={applyLoading}
                      className="apply-btn bg-red-500 hover:bg-red-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      {applyLoading ? 'Đang hủy...' : 'Hủy ứng tuyển'}
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={onToggleSave}
                disabled={saveLoading}
                title={isSaved ? 'Bỏ lưu' : 'Lưu việc làm'}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer disabled:opacity-50 ${isSaved ? 'bg-[#00b14f] border-[#00b14f] text-white' : 'border-gray-200 text-gray-400 hover:border-[#00b14f] hover:text-[#00b14f]'
                  }`}
              >
                <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile apply button */}
          <div className="mt-4 md:hidden">
            {!isApplied ? (
              <button
                onClick={onApplyClick}
                className="apply-btn w-full bg-[#00b14f] hover:bg-[#009940] text-white font-semibold text-sm py-3 rounded-xl cursor-pointer"
              >
                Ứng tuyển ngay
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button className="w-full bg-gray-700 text-white font-semibold text-sm py-3 rounded-xl cursor-not-allowed">
                  Đã ứng tuyển
                </button>
                {isPendingOrReviewing && (
                  <button
                    onClick={onCancelClick}
                    disabled={applyLoading}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-3 rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {applyLoading ? 'Đang hủy...' : 'Hủy ứng tuyển'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Highlights Strip ────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                ),
                label: 'Mức lương',
                value: formatSalary(job.salaryMin, job.salaryMax),
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                ),
                label: 'Kinh nghiệm',
                value: getExperienceLabel(job.experience),
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                ),
                label: 'Hình thức',
                value: getJobTypeLabel(job.type),
              },
              {
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                ),
                label: 'Số lượng',
                value: `${job.quantity} người`,
              },
            ].map(item => (
              <div key={item.label} className="highlight-card bg-[#f8faf9] rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#00b14f] flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 font-medium">{item.label}</div>
                  <div className="text-xs font-semibold text-gray-800 mt-0.5 leading-tight">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
