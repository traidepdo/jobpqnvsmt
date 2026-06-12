import React from "react";
import { 
  FiAlertTriangle, FiMapPin, FiFileText, FiBriefcase, 
  FiDollarSign, FiX, FiCheck 
} from "react-icons/fi";

import { Job } from "../JobDuyetContent";

interface JobDetailPanelProps {
  activeJob: Job;
  onClose: () => void;
  actionLoading: boolean;
  formatDate: (dateStr: string) => string;
  formatSalary: (min?: number, max?: number) => string;
  levelLabels: Record<string, string>;
  expLabels: Record<string, string>;
  typeLabels: Record<string, string>;
  onApprove: (job: Job) => void;
  onRejectTrigger: () => void;
}

export default function JobDetailPanel({
  activeJob,
  onClose,
  actionLoading,
  formatDate,
  formatSalary,
  levelLabels,
  expLabels,
  typeLabels,
  onApprove,
  onRejectTrigger,
}: JobDetailPanelProps) {
  return (
    <div className="bg-[#0b0e16] border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md sticky top-6">
      {/* Detail Header */}
      <div className="p-6 border-b border-white/10 bg-white/2 relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all text-sm"
        >
          ×
        </button>
        <div className="pr-8">
          <span className="inline-block text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-3">
            Đang Chờ Kiểm Duyệt
          </span>
          <h2 className="text-xl font-bold text-white leading-snug">{activeJob.title}</h2>
          <div className="mt-2 flex flex-wrap gap-y-2 gap-x-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5 text-gray-300">🏢 {activeJob.company?.name}</span>
            <span>•</span>
            <span>📁 {activeJob.category?.name}</span>
            <span>•</span>
            <span>🕒 {formatDate(activeJob.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* AI Moderation Alert Banner */}
      {activeJob.rejectReason && (
        <div className="m-6 p-4 rounded-xl border border-red-500/20 bg-red-950/20 flex gap-3.5">
          <FiAlertTriangle className="text-red-400 text-xl shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-300 text-sm">Cảnh Báo Từ Hệ Thống Lọc AI</h4>
            <p className="text-xs text-red-200/80 mt-1 leading-relaxed">
              {activeJob.rejectReason}
            </p>
          </div>
        </div>
      )}

      {/* Quick Specs Grid */}
      <div className="px-6 grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b border-white/5 bg-white/1">
        <div className="p-3 bg-white/3 border border-white/5 rounded-xl">
          <span className="text-[10px] text-gray-400 block uppercase font-medium">Lương</span>
          <span className="text-xs font-bold text-emerald-400 mt-1 block">
            {formatSalary(activeJob.salaryMin, activeJob.salaryMax)}
          </span>
        </div>
        <div className="p-3 bg-white/3 border border-white/5 rounded-xl">
          <span className="text-[10px] text-gray-400 block uppercase font-medium">Cấp bậc</span>
          <span className="text-xs font-bold text-white mt-1 block">
            {activeJob.level ? levelLabels[activeJob.level] || activeJob.level : "—"}
          </span>
        </div>
        <div className="p-3 bg-white/3 border border-white/5 rounded-xl">
          <span className="text-[10px] text-gray-400 block uppercase font-medium">Kinh nghiệm</span>
          <span className="text-xs font-bold text-white mt-1 block">
            {activeJob.experience ? expLabels[activeJob.experience] || activeJob.experience : "—"}
          </span>
        </div>
        <div className="p-3 bg-white/3 border border-white/5 rounded-xl">
          <span className="text-[10px] text-gray-400 block uppercase font-medium">Hình thức</span>
          <span className="text-xs font-bold text-white mt-1 block">
            {typeLabels[activeJob.type] || activeJob.type}
          </span>
        </div>
      </div>

      {/* Detail Content Scroll Area */}
      <div className="p-6 space-y-6 max-h-[420px] overflow-y-auto custom-scrollbar">
        {/* Location */}
        {activeJob.addressDetail && (
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FiMapPin /> Địa Chỉ Làm Việc
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed bg-white/3 p-3.5 rounded-xl border border-white/5">
              {activeJob.addressDetail}
            </p>
          </div>
        )}

        {/* Description */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FiFileText /> Mô Tả Công Việc
          </h4>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap bg-white/3 p-4 rounded-xl border border-white/5">
            {activeJob.description}
          </div>
        </div>

        {/* Requirements */}
        {activeJob.requirements && (
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FiBriefcase /> Yêu Cầu Ứng Viên
            </h4>
            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap bg-white/3 p-4 rounded-xl border border-white/5">
              {activeJob.requirements}
            </div>
          </div>
        )}

        {/* Benefits */}
        {activeJob.benefits && (
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FiDollarSign /> Quyền Lợi Được Hưởng
            </h4>
            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap bg-white/3 p-4 rounded-xl border border-white/5">
              {activeJob.benefits}
            </div>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="p-6 border-t border-white/10 bg-[#0e121d] flex gap-4">
        {/* Reject Trigger */}
        <button
          onClick={onRejectTrigger}
          disabled={actionLoading}
          className="flex-1 py-3 bg-red-600/15 text-red-400 hover:bg-red-600/25 border border-red-500/30 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
        >
          <FiX /> Từ Chối Tin
        </button>

        {/* Approve Trigger */}
        <button
          onClick={() => onApprove(activeJob)}
          disabled={actionLoading}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {actionLoading ? (
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <FiCheck />
          )}
          Phê Duyệt Tin
        </button>
      </div>
    </div>
  );
}
