'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
type CandidateInterviewStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';

interface ApprovedApplication {
    applicationId: string;
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    jobTitle: string;
    jobId: string;
    appliedAt: string;
    isBookmarked: boolean;
}

interface Interview {
    id: string;
    scheduledAt: string;
    type: 'ONLINE' | 'OFFLINE';
    location: string;
    notes: string | null;
    status: InterviewStatus;
    candidateStatus: CandidateInterviewStatus;
    declineReason: string | null;
    application: {
        id: string;
        user: { id: string; name: string; email: string; phone: string | null; avatar: string | null };
        job: { id: string; title: string };
    };
}

const STATUS_CFG: Record<InterviewStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
    SCHEDULED: { label: 'Đã lên lịch', color: '#0052CC', bg: '#EFF4FF', border: '#C7D9FF', icon: 'event' },
    COMPLETED: { label: 'Hoàn thành', color: '#00875A', bg: '#E3FCEF', border: '#ABF5D1', icon: 'check_circle' },
    CANCELLED: { label: 'Đã hủy', color: '#DE350B', bg: '#FFEBE6', border: '#FFBDAD', icon: 'cancel' },
};

const CANDIDATE_CFG: Record<CandidateInterviewStatus, { label: string; color: string; bg: string; icon: string }> = {
    PENDING: { label: 'Chờ xác nhận', color: '#FF8B00', bg: '#FFFAE6', icon: 'hourglass_empty' },
    CONFIRMED: { label: 'Đã xác nhận', color: '#00875A', bg: '#E3FCEF', icon: 'thumb_up' },
    DECLINED: { label: 'Từ chối', color: '#DE350B', bg: '#FFEBE6', icon: 'thumb_down' },
};

const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('vi-VN', {
        weekday: 'short', day: '2-digit', month: '2-digit',
        year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

export default function EmployerInterviewsPage() {
    const router = useRouter();

    // Raw data
    const [pendingApps, setPendingApps] = useState<ApprovedApplication[]>([]);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters — pending section
    const [onlyBookmarked, setOnlyBookmarked] = useState(false);
    const [jobSearch, setJobSearch] = useState('');

    // Filter — interview list
    const [filterStatus, setFilterStatus] = useState<InterviewStatus | ''>('');

    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        const q = filterStatus ? `?status=${filterStatus}` : '';
        const [appsRes, ivRes] = await Promise.all([
            fetch('/api/employer/applications?status=ACCEPTED').then(r => r.json()),
            fetch(`/api/employer/interviews${q}`).then(r => r.json()),
        ]);

        const allApps: any[] = appsRes.applications ?? [];
        const allInterviews: Interview[] = ivRes.interviews ?? [];

        // BƯỚC 1: Gom TẤT CẢ applicationId đã tồn tại trong danh sách interviews vào Set
        // (Bỏ filter status đi để lịch COMPLETED hay CANCELLED cũng bị lọc bỏ luôn)
        const existingInterviewAppIds = new Set(
            allInterviews.map(iv => iv.application.id)
        );

        // BƯỚC 2: Dùng .filter() để LỌC BỎ những ứng viên có id nằm trong Set trên
        const pending: ApprovedApplication[] = allApps
            .filter((app: any) => !existingInterviewAppIds.has(app.id)) // <-- Lọc bỏ tại đây
            .map((app: any) => ({
                applicationId: app.id,
                userId: app.user.id,
                name: app.user.name,
                email: app.user.email,
                phone: app.user.phone ?? null,
                avatar: app.user.avatar ?? null,
                jobTitle: app.job.title,
                jobId: app.job.id,
                appliedAt: app.appliedAt ?? app.createdAt,
                isBookmarked: app.isBookmarked ?? false,
            }));

        setPendingApps(pending);
        setInterviews(allInterviews);
        setLoading(false);
    };

    useEffect(() => { load(); }, [filterStatus]);

    const updateStatus = async (id: string, status: InterviewStatus) => {
        setUpdatingId(id);
        await fetch(`/api/employer/interviews/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        setInterviews(prev => prev.map(iv => iv.id === id ? { ...iv, status } : iv));
        setUpdatingId(null);
    };

    // Derived filtered list for pending section
    const filteredPending = pendingApps
        .filter(c => !onlyBookmarked || c.isBookmarked)
        .filter(c => !jobSearch || c.jobTitle.toLowerCase().includes(jobSearch.toLowerCase()));

    const stats = {
        total: interviews.length,
        scheduled: interviews.filter(i => i.status === 'SCHEDULED').length,
        confirmed: interviews.filter(i => i.candidateStatus === 'CONFIRMED').length,
        pending: interviews.filter(i => i.candidateStatus === 'PENDING' && i.status === 'SCHEDULED').length,
    };

    const checkExistApplications = () => {
        if (pendingApps.length === 0) return false;

        // Gom hết id của interview vào Set để check cho nhanh
        const interviewAppIds = new Set(interviews.map(iv => iv.application.id));

        // Kiểm tra xem có ít nhất một ứng viên CHƯA có trong danh sách interviews không
        const hasCandidateWithoutInterview = pendingApps.some(app => !interviewAppIds.has(app.applicationId));

        return false;
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng lịch', value: stats.total, icon: 'calendar_month', color: '#0052CC', bg: '#EFF4FF' },
                    { label: 'Sắp diễn ra', value: stats.scheduled, icon: 'event', color: '#FF8B00', bg: '#FFFAE6' },
                    { label: 'Đã xác nhận', value: stats.confirmed, icon: 'thumb_up', color: '#00875A', bg: '#E3FCEF' },
                    { label: 'Chờ phản hồi', value: stats.pending, icon: 'hourglass_empty', color: '#6554C0', bg: '#EAE6FF' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                            <span className="material-symbols-outlined text-[22px]" style={{ color: s.color }}>{s.icon}</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#041b3c]">{s.value}</p>
                            <p className="text-xs text-gray-400">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Section 1: Ứng viên chờ đặt lịch ── */}
            {pendingApps.length > 0 && (
                <div>
                    {/* Header + filters */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        {/* Title + count */}
                        <div className="flex items-center gap-2 mr-auto">
                            <div className="w-1.5 h-5 rounded-full bg-[#FF8B00]" />
                            <h2 className="font-bold text-[#041b3c]">Ứng viên chờ đặt lịch</h2>
                            <span className="px-2 py-0.5 bg-[#FFFAE6] text-[#FF8B00] text-xs font-bold rounded-full border border-[#FFE5A0]">
                                {filteredPending.length}
                                {filteredPending.length !== pendingApps.length && (
                                    <span className="text-[#FFB347]">/{pendingApps.length}</span>
                                )}
                            </span>
                        </div>

                        {/* Bookmark toggle */}
                        <button
                            onClick={() => setOnlyBookmarked(v => !v)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${onlyBookmarked
                                ? 'bg-amber-400 border-amber-400 text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-amber-400 hover:text-amber-500'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[15px]">
                                {onlyBookmarked ? 'bookmark' : 'bookmark_border'}
                            </span>
                            Tiềm năng
                        </button>

                        {/* Job search */}
                        <div className="relative">
                            <span className="material-symbols-outlined text-[15px] text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                work
                            </span>
                            <input
                                type="text"
                                value={jobSearch}
                                onChange={e => setJobSearch(e.target.value)}
                                placeholder="Lọc theo vị trí..."
                                className="pl-8 pr-7 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-600 placeholder-gray-400 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10 w-44"
                            />
                            {jobSearch && (
                                <button
                                    onClick={() => setJobSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                                >
                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Cards */}
                    {filteredPending.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-8 text-center">
                            <span className="material-symbols-outlined text-4xl text-gray-200 block mb-2">search_off</span>
                            <p className="text-sm text-gray-400">Không tìm thấy đơn phù hợp</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            {filteredPending.map(c => (
                                <div
                                    key={c.applicationId}
                                    className="bg-white rounded-2xl border border-dashed border-[#C7D9FF] p-4 flex items-center gap-3 hover:border-[#0052CC] hover:shadow-md transition-all group"
                                >
                                    {/* Avatar + bookmark dot */}
                                    <div className="relative w-11 h-11 flex-shrink-0">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0052CC] to-[#6554C0] flex items-center justify-center text-white font-bold text-base overflow-hidden">
                                            {c.avatar
                                                ? <img src={c.avatar} className="w-full h-full object-cover" alt={c.name} />
                                                : c.name[0]?.toUpperCase()}
                                        </div>
                                        {c.isBookmarked && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                                                <span className="material-symbols-outlined text-[10px] text-white">bookmark</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-[#041b3c] text-sm truncate">{c.name}</p>
                                        <p className="text-xs text-[#0052CC] truncate">{c.jobTitle}</p>
                                        <p className="text-xs text-gray-400 truncate">{c.email}</p>
                                    </div>

                                    {/* CTA — navigate theo applicationId */}
                                    <button
                                        onClick={() => router.push(`/employer/interviews/${c.applicationId}`)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-[#0052CC] hover:bg-[#0040a2] text-white text-xs font-bold rounded-xl transition-all flex-shrink-0 group-hover:scale-105"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">add</span>
                                        Đặt lịch
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Section 2: Danh sách lịch phỏng vấn ── */}
            <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full bg-[#0052CC]" />
                        <h2 className="font-bold text-[#041b3c]">Lịch phỏng vấn</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {([['', 'Tất cả'], ['SCHEDULED', 'Đã lên lịch'], ['COMPLETED', 'Hoàn thành'], ['CANCELLED', 'Đã hủy']] as [string, string][]).map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => setFilterStatus(val as any)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterStatus === val
                                    ? 'bg-[#0052CC] text-white'
                                    : 'bg-white border border-gray-200 text-gray-500 hover:border-[#0052CC] hover:text-[#0052CC]'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#0052CC] rounded-full animate-spin" />
                    </div>
                ) : interviews.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-gray-200 block mb-3">event_busy</span>
                        <p className="font-semibold text-gray-400">Chưa có lịch phỏng vấn nào</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {interviews.map(iv => {
                            const sCfg = STATUS_CFG[iv.status];
                            const cCfg = CANDIDATE_CFG[iv.candidateStatus];

                            return (
                                <div key={iv.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                        {/* Avatar */}
                                        <div
                                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0052CC] to-[#6554C0] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 cursor-pointer overflow-hidden"
                                            onClick={() => router.push(`/employer/interviews/${iv.application.id}`)}
                                        >
                                            {iv.application.user.avatar
                                                ? <img src={iv.application.user.avatar} className="w-full h-full object-cover" />
                                                : iv.application.user.name[0]}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <p className="font-bold text-[#041b3c]">{iv.application.user.name}</p>
                                                <span className="text-gray-300">·</span>
                                                <p className="text-sm text-[#0052CC] font-medium">{iv.application.job.title}</p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                    {formatDateTime(iv.scheduledAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">
                                                        {iv.type === 'ONLINE' ? 'videocam' : 'location_on'}
                                                    </span>
                                                    {iv.type === 'ONLINE' ? 'Online' : 'Trực tiếp'}
                                                </span>
                                            </div>
                                            {iv.location && (
                                                <p className="text-xs text-gray-400 mt-1 truncate">📍 {iv.location}</p>
                                            )}
                                        </div>

                                        {/* Badges */}
                                        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                                            <span
                                                className="text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1"
                                                style={{ color: sCfg.color, background: sCfg.bg, borderColor: sCfg.border }}
                                            >
                                                <span className="material-symbols-outlined text-[13px]">{sCfg.icon}</span>
                                                {sCfg.label}
                                            </span>
                                            <span
                                                className="text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                                                style={{ color: cCfg.color, background: cCfg.bg }}
                                            >
                                                <span className="material-symbols-outlined text-[13px]">{cCfg.icon}</span>
                                                {cCfg.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom bar */}
                                    <div className="px-5 pb-4 border-t border-gray-50 pt-3 flex flex-wrap items-center gap-2">
                                        {iv.candidateStatus === 'DECLINED' && iv.declineReason && (
                                            <div className="w-full px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 mb-2">
                                                <span className="font-semibold">Lý do từ chối:</span> {iv.declineReason}
                                            </div>
                                        )}
                                        {iv.notes && (
                                            <div className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500 mb-2">
                                                <span className="font-semibold">Ghi chú:</span> {iv.notes}
                                            </div>
                                        )}

                                        {iv.status === 'SCHEDULED' && (
                                            <>
                                                <button
                                                    onClick={() => router.push(`/employer/interviews/${iv.application.id}`)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0052CC] border border-[#0052CC]/30 hover:bg-[#0052CC]/5 rounded-lg transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">edit</span>
                                                    Sửa lịch
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(iv.id, 'COMPLETED')}
                                                    disabled={updatingId === iv.id}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-200 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                    Hoàn thành
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(iv.id, 'CANCELLED')}
                                                    disabled={updatingId === iv.id}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">cancel</span>
                                                    Hủy lịch
                                                </button>
                                            </>
                                        )}

                                        <div className="ml-auto flex items-center gap-2">
                                            {iv.application.user.email && (
                                                <a
                                                    href={`mailto:${iv.application.user.email}`}
                                                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#0052CC] transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">mail</span>
                                                    {iv.application.user.email}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}