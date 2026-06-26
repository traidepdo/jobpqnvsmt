import Link from "next/link";
import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";
import { formatSalary } from "@/lib/jobLabels";
import { Application } from "@/lib/types/candidate/Application";
export default function Content({ filtered, filterStatus, loading, expandedId, setExpandedId, handleCancelApplication }: { filtered: Application[]; filterStatus: string; loading: boolean; expandedId: string | null; setExpandedId: (expandedId: string | null) => void; handleCancelApplication: (id: string) => void }) {
    return (
        <>
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
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <StatusBadge status={app.status} />
                                                    {(app.status === 'PENDING' || app.status === 'REVIEWING') && (
                                                        <button
                                                            onClick={() => handleCancelApplication(app.id)}
                                                            className="text-[11px] font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                                                        >
                                                            Hủy ứng tuyển
                                                        </button>
                                                    )}
                                                </div>
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
        </>

    );
}