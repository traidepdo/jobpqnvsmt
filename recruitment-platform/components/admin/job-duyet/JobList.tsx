import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

import { Job, Pagination } from "../JobDuyetContent";

interface JobListProps {
  jobs: Job[];
  loading: boolean;
  activeJob: Job | null;
  setActiveJob: (job: Job) => void;
  pagination: Pagination | null;
  onPageChange: (page: number) => void;
  parseRejectReason: (reason?: string) => { score: number | null; words: string[]; raw: string; } | null;
  formatDate: (dateStr: string) => string;
  formatSalary: (min?: number, max?: number) => string;
}

export default function JobList({
  jobs,
  loading,
  activeJob,
  setActiveJob,
  pagination,
  onPageChange,
  parseRejectReason,
  formatDate,
  formatSalary,
}: JobListProps) {
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Đang tải dữ liệu...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-3xl mx-auto mb-4">
            ✓
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Không có tin chờ duyệt</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Tất cả các tin tuyển dụng đã sạch hoặc đã được quản trị viên xử lý hết.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {jobs.map((job) => {
            const moderationData = parseRejectReason(job.rejectReason);
            const isHighRisk = moderationData && (moderationData.score ?? 0) >= 10;
            const isActive = activeJob?.id === job.id;

            return (
              <div
                key={job.id}
                onClick={() => setActiveJob(job)}
                className={`p-5 cursor-pointer transition-all duration-200 ${isActive
                  ? "bg-amber-500/10 border-l-4 border-amber-500"
                  : "hover:bg-white/5 border-l-4 border-transparent"
                  }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base truncate hover:text-amber-400 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span className="font-semibold text-gray-300">{job.company?.name}</span>
                      <span>•</span>
                      <span>{job.category?.name}</span>
                    </div>
                  </div>

                  {moderationData && (
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${isHighRisk
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                      {moderationData.score} Điểm nghi vấn
                    </span>
                  )}
                </div>

                {/* Display matched words */}
                {moderationData && moderationData.words.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    <span className="text-[11px] text-gray-400 mr-1 flex items-center gap-0.5">
                      <FiAlertTriangle className="text-amber-500" /> Phát hiện:
                    </span>
                    {moderationData.words.slice(0, 4).map((word, idx) => (
                      <span key={idx} className="bg-red-500/15 text-red-300 text-[10px] px-2 py-0.5 rounded border border-red-500/20">
                        {word}
                      </span>
                    ))}
                    {moderationData.words.length > 4 && (
                      <span className="text-[10px] text-gray-400 self-center">
                        +{moderationData.words.length - 4} từ khác
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                  <span>Đăng ngày: {formatDate(job.createdAt)}</span>
                  <span className="text-gray-300 font-semibold">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
