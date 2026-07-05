'use client';

import React from 'react';
import { JobDetails } from '@/components/jobs/JobDetailsClient';

interface JobDetailSidebarProps {
  job: any;
  isApplied: boolean;
  isPendingOrReviewing: boolean;
  applyLoading: boolean;
  onApplyClick: () => void;
  onCancelClick: () => void;
}

export default function JobDetailSidebar({
  job,
  isApplied,
  isPendingOrReviewing,
  applyLoading,
  onApplyClick,
  onCancelClick,
}: JobDetailSidebarProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* CTA card */}
      <div className="bg-[#065f36] rounded-2xl p-5 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/5 translate-y-6 -translate-x-6" />
        <div className="relative z-10">
          {job.deadline && new Date(job.deadline) < new Date() ? (
            <div>
              <p className="text-white font-bold text-sm mb-1">Tin tuyển dụng đã hết hạn</p>
              <p className="text-white/60 text-xs mb-4 leading-relaxed">Không còn nhận hồ sơ ứng tuyển cho vị trí này.</p>
              <button
                disabled
                className="w-full bg-slate-800 text-white/50 font-bold text-sm py-3 rounded-xl cursor-not-allowed"
              >
                Đã hết hạn nộp
              </button>
            </div>
          ) : (
            <div>
              <p className="text-white font-bold text-sm mb-1">Đừng bỏ lỡ cơ hội này!</p>
              <p className="text-white/60 text-xs mb-4 leading-relaxed">Phản hồi phỏng vấn trong 2–3 ngày làm việc.</p>
              {!isApplied ? (
                <button
                  onClick={onApplyClick}
                  className="apply-btn w-full bg-[#00b14f] hover:bg-[#009940] text-white font-semibold text-sm py-3 rounded-xl cursor-pointer"
                >
                  Nộp hồ sơ ngay
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <button className="w-full bg-[#00b14f]/30 text-white/70 font-semibold text-sm py-3 rounded-xl cursor-not-allowed">
                    Đã nộp hồ sơ
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
          )}
        </div>
      </div>

      {/* Company card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {job.company.logo ? (
              <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-contain p-1" />
            ) : (
              <span className="text-xl">🏢</span>
            )}
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900 leading-tight">{job.company.name}</p>
            <p className="text-xs text-[#00b14f] mt-0.5">{job.company.industry || 'Khách sạn & Du lịch'}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-gray-100 pt-4">
          {[
            { label: 'Quy mô', value: job.company.size || 'Đang cập nhật' },
            { label: 'Địa điểm', value: job.company.ward?.name || 'Dương Đông' },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center">
              <span className="text-xs text-gray-400">{row.label}</span>
              <span className="text-xs font-semibold text-gray-700">{row.value}</span>
            </div>
          ))}
          {job.company.website && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Website</span>
              <a href={job.company.website} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#00b14f] hover:underline">
                Truy cập →
              </a>
            </div>
          )}
        </div>

        {job.company.description && (
          <p className="text-xs text-gray-400 leading-relaxed mt-4 border-t border-gray-100 pt-4 italic">
            {job.company.description}
          </p>
        )}
      </div>
    </div>
  );
}
