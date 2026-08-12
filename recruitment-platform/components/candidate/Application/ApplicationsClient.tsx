'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Application } from '@/lib/types/candidate/Application';
import { cancelApplicationAction } from '@/server/actions/candidate/application.action';
import { formatSalary, getJobTypeLabel, formatDateVi } from '@/lib/jobLabels';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; ring: string }> = {
    PENDING: { label: 'Chờ xem xét', color: 'text-amber-600 border-amber-100 bg-amber-50/50', dot: 'bg-amber-400', ring: 'ring-amber-100' },
    REVIEWING: { label: 'Đang xem xét', color: 'text-blue-600 border-blue-100 bg-blue-50/50', dot: 'bg-blue-500', ring: 'ring-blue-100' },
    INTERVIEW: { label: 'Phỏng vấn', color: 'text-purple-600 border-purple-100 bg-purple-50/50', dot: 'bg-purple-500', ring: 'ring-purple-100' },
    ACCEPTED: { label: 'Đã nhận', color: 'text-[#00b14f] border-emerald-100 bg-emerald-50/50', dot: 'bg-[#00b14f]', ring: 'ring-emerald-100' },
    REJECTED: { label: 'Không phù hợp', color: 'text-rose-500 border-rose-100 bg-rose-50/50', dot: 'bg-rose-400', ring: 'ring-rose-100' },
};

const STATUS_OPTIONS = [
    { label: 'Tất cả', value: '' },
    { label: 'Chờ xem xét', value: 'PENDING' },
    { label: 'Đang xem xét', value: 'REVIEWING' },
    { label: 'Phỏng vấn', value: 'INTERVIEW' },
    { label: 'Đã nhận', value: 'ACCEPTED' },
    { label: 'Không phù hợp', value: 'REJECTED' },
];

type ViewMode = 'card' | 'list';

export default function ApplicationsClient({
    initialApplications,
}: {
    initialApplications: Application[];
}) {
    const [applications, setApplications] = useState<Application[]>(initialApplications);
    const [filterStatus, setFilterStatus] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('card');

    const handleCancelApplication = (id: string) => {
        setCancelTargetId(id);
    };

    const confirmCancelApplication = async () => {
        if (!cancelTargetId) return;
        const result = await cancelApplicationAction(cancelTargetId);
        if (result.success) {
            setApplications(prev => prev.filter(app => app.id !== cancelTargetId));
        } else {
            alert(result.error || 'Không thể hủy ứng tuyển. Vui lòng thử lại.');
        }
        setCancelTargetId(null);
    };

    const statusCounts = STATUS_OPTIONS.slice(1).reduce<Record<string, number>>((acc, opt) => {
        acc[opt.value] = applications.filter(a => a.status === opt.value).length;
        return acc;
    }, {});

    const filtered = filterStatus
        ? applications.filter(a => a.status === filterStatus)
        : applications;

    return (
        <div className="w-full space-y-5 animate-fadeIn pb-10">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6 sm:p-8 border border-emerald-500/10">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-[#00b14f] font-bold">description</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#009940]">Đơn xin việc</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            Việc làm đã ứng tuyển
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {applications.length} đơn · theo dõi tiến trình tuyển dụng của bạn tại đây
                        </p>
                    </div>
                    <Link
                        href="/jobs"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00b14f] hover:bg-[#009940] text-white text-sm font-bold rounded-2xl transition-all duration-200 shadow-md shadow-[#00b14f]/10 hover:shadow-[#00b14f]/20 active:scale-95 self-start sm:self-auto"
                    >
                        <span className="material-symbols-outlined text-base">explore</span>
                        Tìm thêm việc làm
                    </Link>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-12 translate-x-12" />
            </div>

            {/* Toolbar: filter pills + view toggle */}
            {applications.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 flex-1">
                        {STATUS_OPTIONS.map(s => {
                            const count = s.value ? statusCounts[s.value] || 0 : applications.length;
                            const isActive = filterStatus === s.value;
                            return (
                                <button
                                    key={s.value}
                                    onClick={() => setFilterStatus(s.value)}
                                    className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer ${isActive
                                        ? 'bg-[#00b14f] text-white border-[#00b14f] shadow-sm shadow-[#00b14f]/20 scale-[1.02]'
                                        : 'bg-white text-slate-500 border-slate-100 hover:border-emerald-200 hover:text-[#00b14f]'
                                        }`}
                                >
                                    <span>{s.label}</span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'
                                        }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center gap-0.5 bg-white border border-slate-100 rounded-full p-1 self-start sm:self-auto shadow-sm">
                        <button
                            onClick={() => setViewMode('card')}
                            aria-label="Dạng thẻ"
                            className={`flex items-center gap-1 h-7 px-3 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${viewMode === 'card' ? 'bg-[#00b14f] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[15px]">grid_view</span>
                            <span className="hidden sm:inline">Thẻ</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            aria-label="Dạng danh sách"
                            className={`flex items-center gap-1 h-7 px-3 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${viewMode === 'list' ? 'bg-[#00b14f] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[15px]">view_list</span>
                            <span className="hidden sm:inline">Danh sách</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Applications */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">assignment_late</span>
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">
                        {filterStatus ? 'Không có đơn ứng tuyển nào ở trạng thái này' : 'Chưa ứng tuyển việc làm nào'}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mb-5">
                        {filterStatus
                            ? 'Vui lòng chọn trạng thái khác để kiểm tra đơn ứng tuyển của bạn.'
                            : 'Bắt đầu nộp hồ sơ ứng tuyển để có cơ hội việc làm tốt nhất.'}
                    </p>
                    {!filterStatus && (
                        <Link
                            href="/jobs"
                            className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#00b14f] hover:bg-[#009940] text-white font-bold rounded-full text-xs transition-all shadow-md shadow-[#00b14f]/10 active:scale-95"
                        >
                            Tìm việc làm ngay
                        </Link>
                    )}
                </div>
            ) : viewMode === 'card' ? (
                <div key="card-view" className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {filtered.map((app, idx) => {
                        const expanded = expandedId === app.id;
                        const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDING;

                        return (
                            <div
                                key={app.id}
                                style={{ animationDelay: `${Math.min(idx, 8) * 45}ms` }}
                                className="animate-fadeIn group relative bg-white rounded-2xl border border-slate-100/80 p-5 flex flex-col gap-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_28px_rgba(0,177,79,0.12)] hover:border-emerald-100 hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex gap-3 min-w-0">
                                        <div className={`w-11 h-11 rounded-xl border bg-slate-50/50 flex items-center justify-center p-1.5 flex-shrink-0 shadow-sm ring-2 ${status.ring} group-hover:scale-105 transition-transform duration-300`}>
                                            {app.job.company?.logo ? (
                                                <img src={app.job.company.logo} alt={app.job.company.name} className="w-full h-full object-contain rounded" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-emerald-500/10 to-emerald-500/20 flex items-center justify-center rounded">
                                                    <span className="text-[#00b14f] font-bold text-base">{app.job.company?.name?.charAt(0) || 'C'}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <Link
                                                href={`/jobs/${app.job.slug}`}
                                                className="font-bold text-slate-800 hover:text-[#00b14f] transition-colors text-sm line-clamp-1 block"
                                            >
                                                {app.job.title}
                                            </Link>
                                            <p className="text-[11px] text-[#00b14f] font-semibold mt-0.5 line-clamp-1 hover:underline cursor-pointer">
                                                {app.job.company?.name || 'Công ty'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[9.5px] font-bold ${status.color}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
                                        {status.label}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                                    <span className="flex items-center gap-1 text-[#00b14f] font-bold bg-emerald-50/60 px-2 py-0.5 rounded-lg">
                                        <span className="material-symbols-outlined text-[13px]">payments</span>
                                        {formatSalary(app.job.salaryMin, app.job.salaryMax)}
                                    </span>
                                    <span className="flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">
                                        <span className="material-symbols-outlined text-[13px]">work</span>
                                        {app.job.category.name}
                                    </span>
                                </div>

                                {app.coverLetter && (
                                    <button
                                        onClick={() => setExpandedId(expanded ? null : app.id)}
                                        className="flex items-center gap-0.5 text-[10.5px] text-slate-400 hover:text-[#00b14f] transition-colors cursor-pointer font-medium w-fit"
                                    >
                                        <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${expanded ? 'rotate-180 text-[#00b14f]' : ''}`}>
                                            expand_more
                                        </span>
                                        {expanded ? 'Ẩn thư giới thiệu' : 'Xem thư giới thiệu'}
                                    </button>
                                )}
                                {expanded && app.coverLetter && (
                                    <div className="bg-slate-50/70 rounded-xl p-2.5 border border-slate-100/60 animate-slideUp">
                                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Thư giới thiệu</p>
                                        <p className="text-[10.5px] text-slate-500 leading-relaxed whitespace-pre-line line-clamp-4">{app.coverLetter}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between border-t border-slate-50 pt-2.5 mt-auto">
                                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                        <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                        {new Date(app.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </span>
                                    <div className="flex items-center gap-2.5">
                                        {app.resume && (
                                            <Link
                                                href={`/cv/${app.resume.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                                            >
                                                <span className="material-symbols-outlined text-[13px]">resume</span>
                                                CV
                                            </Link>
                                        )}
                                        {(app.status === 'PENDING' || app.status === 'REVIEWING') && (
                                            <button
                                                onClick={() => handleCancelApplication(app.id)}
                                                className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer hover:underline"
                                            >
                                                Hủy ứng tuyển
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div key="list-view" className="space-y-3">
                    {filtered.map((app, idx) => {
                        const expanded = expandedId === app.id;
                        const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDING;

                        return (
                            <div
                                key={app.id}
                                style={{ animationDelay: `${Math.min(idx, 10) * 35}ms` }}
                                className="animate-fadeIn group relative bg-white rounded-2xl border border-slate-100/80 pl-5 pr-5 py-4 flex flex-col gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-[0_6px_20px_rgba(0,177,79,0.08)] hover:border-emerald-100 transition-all duration-300 overflow-hidden"
                            >
                                <span className={`absolute left-0 top-0 bottom-0 w-1 ${status.dot} scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-300`} />

                                <div className="flex flex-col sm:flex-row gap-3 justify-between items-start">
                                    <div className="flex gap-3 min-w-0 flex-1">
                                        <div className={`w-11 h-11 rounded-xl border bg-slate-50/50 flex items-center justify-center p-1.5 flex-shrink-0 shadow-sm ring-2 ${status.ring} group-hover:scale-105 transition-transform duration-200`}>
                                            {app.job.company?.logo ? (
                                                <img src={app.job.company.logo} alt={app.job.company.name} className="w-full h-full object-contain rounded" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-emerald-500/10 to-emerald-500/20 flex items-center justify-center rounded">
                                                    <span className="text-[#00b14f] font-bold text-base">{app.job.company?.name?.charAt(0) || 'C'}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Link
                                                    href={`/jobs/${app.job.slug}`}
                                                    className="font-bold text-slate-800 hover:text-[#00b14f] transition-colors text-sm line-clamp-1"
                                                >
                                                    {app.job.title}
                                                </Link>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9.5px] font-bold ${status.color}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                    {status.label}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-[#00b14f] font-semibold mt-0.5 hover:underline cursor-pointer w-fit">
                                                {app.job.company?.name || 'Công ty'}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10.5px]">
                                                <span className="flex items-center gap-1 text-[#00b14f] font-bold bg-emerald-50/50 px-2 py-0.5 rounded-lg">
                                                    <span className="material-symbols-outlined text-[13px]">payments</span>
                                                    {formatSalary(app.job.salaryMin, app.job.salaryMax)}
                                                </span>
                                                <span className="flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">
                                                    <span className="material-symbols-outlined text-[13px]">work</span>
                                                    {app.job.category.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col items-end gap-2 w-full sm:w-auto justify-between sm:justify-start shrink-0">
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                            <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                            {new Date(app.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </span>
                                        <div className="flex items-center gap-2.5">
                                            {app.resume && (
                                                <Link
                                                    href={`/cv/${app.resume.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                                                >
                                                    <span className="material-symbols-outlined text-[13px]">resume</span>
                                                    CV
                                                </Link>
                                            )}
                                            {(app.status === 'PENDING' || app.status === 'REVIEWING') && (
                                                <button
                                                    onClick={() => handleCancelApplication(app.id)}
                                                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer hover:underline"
                                                >
                                                    Hủy ứng tuyển
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {app.coverLetter && (
                                    <div className="pl-14">
                                        <button
                                            onClick={() => setExpandedId(expanded ? null : app.id)}
                                            className="flex items-center gap-0.5 text-[10.5px] text-slate-400 hover:text-[#00b14f] transition-colors cursor-pointer font-medium"
                                        >
                                            <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${expanded ? 'rotate-180 text-[#00b14f]' : ''}`}>
                                                expand_more
                                            </span>
                                            {expanded ? 'Ẩn thư giới thiệu' : 'Xem thư giới thiệu đã nộp'}
                                        </button>

                                        {expanded && (
                                            <div className="mt-2 bg-slate-50/70 rounded-xl p-3 border border-slate-100/60 animate-slideUp">
                                                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Thư giới thiệu</p>
                                                <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-line">{app.coverLetter}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {cancelTargetId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setCancelTargetId(null)} />
                    <div className="relative bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl z-10 text-center animate-slideUp border border-slate-100">
                        <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3 text-rose-500">
                            <span className="material-symbols-outlined text-xl">warning</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mb-1.5">Xác nhận hủy ứng tuyển?</h3>
                        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                            Hành động này sẽ xóa đơn xin việc của bạn khỏi hệ thống của nhà tuyển dụng. Bạn không thể hoàn tác hành động này.
                        </p>
                        <div className="flex gap-2.5">
                            <button
                                onClick={() => setCancelTargetId(null)}
                                className="flex-1 py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-full hover:bg-slate-50 transition-all cursor-pointer"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={confirmCancelApplication}
                                className="flex-1 py-2 text-xs font-bold text-white bg-rose-500 rounded-full hover:bg-rose-600 transition-all active:scale-95 cursor-pointer"
                            >
                                Hủy ứng tuyển
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}