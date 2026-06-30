'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Interview } from '@/lib/types/candidate/interviews';
import { STATUS_CFG, CANDIDATE_CFG } from '@/lib/interviewLabels';
import { useInterviews } from '@/lib/hooks/useInterviews';

// ── Modal từ chối ─────────────────────────────────────────────
function DeclineModal({ onConfirm, onClose }: { onConfirm: (reason: string) => void; onClose: () => void }) {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 animate-slideUp">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">Từ chối lịch phỏng vấn</h3>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
                <div className="px-5 py-4">
                    <p className="text-xs text-slate-400 mb-2.5">Vui lòng cho biết lý do từ chối để nhà tuyển dụng sắp xếp lại:</p>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Ví dụ: Tôi có lịch bận đột xuất, mong muốn được dời sang ngày khác..."
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-rose-400 focus:ring-0 resize-none text-slate-700 placeholder-slate-400 bg-slate-50/50"
                    />
                </div>
                <div className="px-5 py-3.5 border-t border-slate-50 flex gap-2.5 justify-end">
                    <button onClick={onClose} className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
                        Hủy
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        className="flex items-center gap-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-sm">thumb_down</span>
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────
export default function CandidateInterviewsPage({ interviewsData }: { interviewsData: Interview[] }) {
    const { formatDateTime, formatCountdown, interviews, loading, respondingId, declineModal, setDeclineModal, setRespondingId, setInterviews, setLoading, respond } = useInterviews(interviewsData);
    
    useEffect(() => {
        if (interviewsData) {
            setInterviews(interviewsData);
            setLoading(false);
        }
    }, [interviewsData]);

    const upcoming = interviews.filter(i => i.status === 'SCHEDULED' && i.candidateStatus !== 'DECLINED');
    const others = interviews.filter(i => i.status !== 'SCHEDULED' || i.candidateStatus === 'DECLINED');
    const pendingCount = interviews.filter(i => i.candidateStatus === 'PENDING' && i.status === 'SCHEDULED').length;

    return (
        <div className="w-full space-y-6 animate-fadeIn pb-10">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6 sm:p-8 border border-emerald-500/10">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-[#00b14f] font-bold">event</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#009940]">Lịch trình</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            Lịch phỏng vấn
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {pendingCount > 0
                                ? <span>Bạn có <span className="text-orange-500 font-bold">{pendingCount} lịch phỏng vấn</span> chờ xác nhận</span>
                                : 'Theo dõi và phản hồi các cuộc hẹn phỏng vấn từ nhà tuyển dụng'
                            }
                        </p>
                    </div>
                    {pendingCount > 0 && (
                        <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl border border-orange-200/50 shadow-sm flex items-center gap-2 self-start sm:self-auto animate-pulse">
                            <span className="material-symbols-outlined text-base font-bold">notifications_active</span>
                            <span className="text-xs font-bold">Yêu cầu phản hồi gấp</span>
                        </div>
                    )}
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-12 translate-x-12" />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
                </div>
            ) : interviews.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">event_busy</span>
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">Chưa có lịch phỏng vấn nào</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mb-5">
                        Hãy tiếp tục ứng tuyển các công việc phù hợp để nhận lời mời phỏng vấn từ nhà tuyển dụng.
                    </p>
                    <Link 
                        href="/jobs" 
                        className="inline-flex items-center px-5 py-2 bg-[#00b14f] hover:bg-[#009940] text-white font-bold rounded-lg text-xs transition-all active:scale-95"
                    >
                        Tìm việc làm ngay
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* ── Upcoming ── */}
                    {upcoming.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">
                                Sắp diễn ra ({upcoming.length})
                            </h2>
                            <div className="space-y-3">
                                {upcoming.map(iv => {
                                    const cCfg = CANDIDATE_CFG[iv.candidateStatus];
                                    const countdown = formatCountdown(iv.scheduledAt);
                                    const isPending = iv.candidateStatus === 'PENDING';

                                    return (
                                        <div 
                                            key={iv.id} 
                                            className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)]
                                                ${isPending ? 'border-orange-200/80 bg-orange-50/5' : 'border-slate-100'}`}
                                        >
                                            {/* Pending banner */}
                                            {isPending && (
                                                <div className="px-4 py-2 bg-orange-50 border-b border-orange-100/50 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-sm text-orange-500 animate-pulse">notifications_active</span>
                                                    <p className="text-[10px] font-bold text-orange-700">Cần xác nhận — nhà tuyển dụng đang chờ phản hồi của bạn</p>
                                                </div>
                                            )}

                                            <div className="p-4.5">
                                                <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                                                    <div className="flex gap-3.5 min-w-0">
                                                        {/* Company logo */}
                                                        <div className="w-12 h-12 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center p-1.5 flex-shrink-0 shadow-sm">
                                                            {iv.application.job.company.logo
                                                                ? <img src={iv.application.job.company.logo} alt="" className="w-full h-full object-contain rounded" />
                                                                : <span className="text-blue-600 font-bold text-base">{iv.application.job.company.name[0]}</span>
                                                            }
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-800 text-sm sm:text-base line-clamp-1">{iv.application.job.title}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5">{iv.application.job.company.name}</p>

                                                            {/* Thời gian */}
                                                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                                                <span className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg">
                                                                    <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
                                                                    <span className="font-semibold">{formatDateTime(iv.scheduledAt)}</span>
                                                                </span>
                                                                {countdown && (
                                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100/30">
                                                                        <span className="material-symbols-outlined text-[13px]">timer</span>
                                                                        Còn {countdown}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Hình thức & địa điểm */}
                                                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                                                                <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-md">
                                                                    <span className="material-symbols-outlined text-[13px]">
                                                                        {iv.type === 'ONLINE' ? 'videocam' : 'location_on'}
                                                                    </span>
                                                                    {iv.type === 'ONLINE' ? 'Online' : 'Trực tiếp'}
                                                                </span>
                                                                <span className="text-[11px] text-slate-400 truncate max-w-[260px] self-center">
                                                                    {iv.location}
                                                                </span>
                                                                {iv.type === 'ONLINE' && (
                                                                    <a href={iv.location} target="_blank" rel="noreferrer"
                                                                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 hover:underline">
                                                                        Tham gia
                                                                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                                                    </a>
                                                                )}
                                                            </div>

                                                            {/* Ghi chú */}
                                                            {iv.notes && (
                                                                <div className="mt-3.5 px-3.5 py-2.5 bg-slate-50 border border-slate-100/40 rounded-lg text-xs text-slate-500">
                                                                    <span className="font-bold text-slate-600">Ghi chú:</span> {iv.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Status badge */}
                                                    <span 
                                                        className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 self-start sm:self-auto"
                                                        style={{ color: cCfg.color, background: cCfg.bg, borderColor: 'transparent' }}
                                                    >
                                                        <span className="material-symbols-outlined text-[13px]">{cCfg.icon}</span>
                                                        {cCfg.label}
                                                    </span>
                                                </div>

                                                {/* Action buttons */}
                                                {isPending && (
                                                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex gap-2.5">
                                                        <button
                                                            onClick={() => respond(iv.id, 'CONFIRMED')}
                                                            disabled={respondingId === iv.id}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#00b14f] hover:bg-[#009940] text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-base">thumb_up</span>
                                                            Xác nhận tham gia
                                                        </button>
                                                        <button
                                                            onClick={() => setDeclineModal(iv.id)}
                                                            disabled={respondingId === iv.id}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-base">thumb_down</span>
                                                            Từ chối
                                                        </button>
                                                    </div>
                                                )}

                                                {iv.candidateStatus === 'CONFIRMED' && (
                                                    <div className="mt-3.5 pt-3.5 border-t border-slate-100">
                                                        <div className="flex items-center gap-1.5 text-xs text-[#00b14f] font-bold bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/10">
                                                            <span className="material-symbols-outlined text-base">check_circle</span>
                                                            Bạn đã xác nhận tham gia phỏng vấn này. Chúc bạn may mắn! 🎉
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Lịch sử ── */}
                    {others.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">
                                Lịch sử ({others.length})
                            </h2>
                            <div className="space-y-2">
                                {others.map(iv => {
                                    const sCfg = STATUS_CFG[iv.status];
                                    const cCfg = CANDIDATE_CFG[iv.candidateStatus];
                                    return (
                                        <div key={iv.id} className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-all">
                                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center p-1 flex-shrink-0">
                                                    {iv.application.job.company.logo
                                                        ? <img src={iv.application.job.company.logo} alt="" className="w-full h-full object-contain rounded" />
                                                        : <span className="text-gray-400 font-bold text-sm">{iv.application.job.company.name[0]}</span>
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-700 truncate">{iv.application.job.title}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{iv.application.job.company.name} · {formatDateTime(iv.scheduledAt)}</p>
                                                    {iv.declineReason && (
                                                        <p className="text-[11px] text-rose-500 mt-1 pl-1 border-l-2 border-rose-300">Lý do từ chối: {iv.declineReason}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border"
                                                    style={{ color: sCfg.color, background: sCfg.bg, borderColor: sCfg.border }}>
                                                    {sCfg.label}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                                                    style={{ color: cCfg.color, background: cCfg.bg }}>
                                                    {cCfg.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Decline modal */}
            {declineModal && (
                <DeclineModal
                    onClose={() => setDeclineModal(null)}
                    onConfirm={reason => respond(declineModal, 'DECLINED', reason)}
                />
            )}
        </div>
    );
}