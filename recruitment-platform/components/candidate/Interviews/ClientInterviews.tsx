'use client';

import { useEffect, useState } from 'react';
import { Interview } from '@/lib/types/candidate/interviews';
import { STATUS_CFG, CANDIDATE_CFG } from '@/lib/interviewLabels';
import { useInterviews } from '@/lib/hooks/useInterviews';

// ── Modal từ chối ─────────────────────────────────────────────
function DeclineModal({ onConfirm, onClose }: { onConfirm: (reason: string) => void; onClose: () => void }) {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px] text-red-500">cancel</span>
                        </div>
                        <h3 className="font-bold text-[#041b3c]">Từ chối lịch phỏng vấn</h3>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
                <div className="px-6 py-5">
                    <p className="text-sm text-gray-500 mb-3">Vui lòng cho biết lý do để nhà tuyển dụng có thể sắp xếp lại:</p>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Ví dụ: Tôi có việc bận vào thời gian này, mong được dời lịch..."
                        rows={4}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 resize-none"
                    />
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">
                        Hủy
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        className="flex items-center gap-2 px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-all"
                    >
                        <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                        Xác nhận từ chối
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
        <div className="min-h-screen bg-[#f4f5f5]">

            <div className="max-w-[1000px] mx-auto px-6 py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-[#041b3c]">Lịch phỏng vấn</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {pendingCount > 0
                                ? <span>Bạn có <span className="text-orange-500 font-semibold">{pendingCount} lịch</span> chờ xác nhận</span>
                                : 'Quản lý lịch phỏng vấn của bạn'
                            }
                        </p>
                    </div>
                </div>
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
                    </div>
                ) : interviews.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center">
                        <span className="material-symbols-outlined text-5xl text-gray-200 block mb-3">event_busy</span>
                        <p className="font-semibold text-gray-400">Chưa có lịch phỏng vấn nào</p>
                        <p className="text-sm text-gray-300 mt-1">Tiếp tục ứng tuyển để nhận lịch phỏng vấn</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* ── Upcoming ── */}
                        {upcoming.length > 0 && (
                            <div>
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                                    Sắp diễn ra ({upcoming.length})
                                </h2>
                                <div className="space-y-3">
                                    {upcoming.map(iv => {
                                        const cCfg = CANDIDATE_CFG[iv.candidateStatus];
                                        const countdown = formatCountdown(iv.scheduledAt);
                                        const isPending = iv.candidateStatus === 'PENDING';

                                        return (
                                            <div key={iv.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden
                                                ${isPending ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-100'}`}>

                                                {/* Pending banner */}
                                                {isPending && (
                                                    <div className="px-5 py-2.5 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[16px] text-orange-500 animate-pulse">notifications_active</span>
                                                        <p className="text-xs font-bold text-orange-600">Cần xác nhận — nhà tuyển dụng đang chờ phản hồi của bạn</p>
                                                    </div>
                                                )}

                                                <div className="p-5">
                                                    <div className="flex items-start gap-4">
                                                        {/* Company logo */}
                                                        <div className="w-12 h-12 rounded-xl bg-[#EFF4FF] flex items-center justify-center font-bold text-[#0052CC] text-lg flex-shrink-0 overflow-hidden border border-[#C7D9FF]">
                                                            {iv.application.job.company.logo
                                                                ? <img src={iv.application.job.company.logo} alt="" className="w-full h-full object-contain p-1" />
                                                                : iv.application.job.company.name[0]
                                                            }
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-[#041b3c] text-base">{iv.application.job.title}</p>
                                                            <p className="text-sm text-gray-500">{iv.application.job.company.name}</p>

                                                            {/* Thời gian */}
                                                            <div className="mt-3 flex flex-wrap gap-3">
                                                                <div className="flex items-center gap-1.5 text-sm">
                                                                    <div className="w-7 h-7 rounded-lg bg-[#EFF4FF] flex items-center justify-center">
                                                                        <span className="material-symbols-outlined text-[15px] text-[#0052CC]">schedule</span>
                                                                    </div>
                                                                    <span className="text-gray-600 font-medium">{formatDateTime(iv.scheduledAt)}</span>
                                                                </div>
                                                                {countdown && (
                                                                    <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full">
                                                                        <span className="material-symbols-outlined text-[13px]">timer</span>
                                                                        {countdown}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Hình thức & địa điểm */}
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                                                                    <span className="material-symbols-outlined text-[13px]">
                                                                        {iv.type === 'ONLINE' ? 'videocam' : 'location_on'}
                                                                    </span>
                                                                    {iv.type === 'ONLINE' ? 'Online' : 'Trực tiếp'}
                                                                </span>
                                                                <span className="text-xs text-gray-400 truncate max-w-[300px]">
                                                                    {iv.location}
                                                                </span>
                                                                {iv.type === 'ONLINE' && (
                                                                    <a href={iv.location} target="_blank" rel="noreferrer"
                                                                        className="text-xs font-semibold text-[#0052CC] hover:underline flex items-center gap-0.5">
                                                                        Tham gia
                                                                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                                                    </a>
                                                                )}
                                                            </div>

                                                            {/* Ghi chú */}
                                                            {iv.notes && (
                                                                <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500">
                                                                    <span className="font-semibold">Ghi chú:</span> {iv.notes}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Status badge */}
                                                        <span className="flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                                                            style={{ color: cCfg.color, background: cCfg.bg }}>
                                                            <span className="material-symbols-outlined text-[13px]">{cCfg.icon}</span>
                                                            {cCfg.label}
                                                        </span>
                                                    </div>

                                                    {/* Action buttons */}
                                                    {isPending && (
                                                        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                                                            <button
                                                                onClick={() => respond(iv.id, 'CONFIRMED')}
                                                                disabled={respondingId === iv.id}
                                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#00b14f] hover:bg-[#009f47] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                                                                Xác nhận tham gia
                                                            </button>
                                                            <button
                                                                onClick={() => setDeclineModal(iv.id)}
                                                                disabled={respondingId === iv.id}
                                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">thumb_down</span>
                                                                Từ chối
                                                            </button>
                                                        </div>
                                                    )}

                                                    {iv.candidateStatus === 'CONFIRMED' && (
                                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                                            <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                                                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                                                Bạn đã xác nhận tham gia — Chúc bạn phỏng vấn thành công! 🎉
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
                            <div>
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                                    Lịch sử ({others.length})
                                </h2>
                                <div className="space-y-2">
                                    {others.map(iv => {
                                        const sCfg = STATUS_CFG[iv.status];
                                        const cCfg = CANDIDATE_CFG[iv.candidateStatus];
                                        return (
                                            <div key={iv.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 opacity-80">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-400 flex-shrink-0 overflow-hidden">
                                                    {iv.application.job.company.logo
                                                        ? <img src={iv.application.job.company.logo} alt="" className="w-full h-full object-contain p-0.5" />
                                                        : iv.application.job.company.name[0]
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-600 truncate">{iv.application.job.title}</p>
                                                    <p className="text-xs text-gray-400">{iv.application.job.company.name} · {formatDateTime(iv.scheduledAt)}</p>
                                                    {iv.declineReason && (
                                                        <p className="text-xs text-red-400 mt-0.5">Lý do từ chối: {iv.declineReason}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className="text-[11px] font-bold px-2 py-1 rounded-full border"
                                                        style={{ color: sCfg.color, background: sCfg.bg, borderColor: sCfg.border }}>
                                                        {sCfg.label}
                                                    </span>
                                                    <span className="text-[11px] font-bold px-2 py-1 rounded-full"
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
            </div>

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