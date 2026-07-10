'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApprovedApplication, Interview, InterviewStatus, CandidateInterviewStatus, Job } from '@/lib/types/employer/interviews';
import { STATUS_CFG, CANDIDATE_CFG } from '@/lib/jobLabelsInterviews';

const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.toLocaleDateString('vi-VN', { weekday: 'short' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${day}, ${date} lúc ${time}`;
};

export default function EmployerInterviewsPage({
    initialPendingApps,
    initialInterviews,
    initialJob
}: {
    initialPendingApps: ApprovedApplication[];
    initialInterviews: Interview[];
    initialJob: Job[];
}) {
    const router = useRouter();

    const [pendingApps, setPendingApps] = useState<ApprovedApplication[]>(initialPendingApps);
    const [interviews, setInterviews] = useState<Interview[]>(initialInterviews);
    const [jobList, setJobList] = useState<Job[]>(initialJob);
    const [loading, setLoading] = useState(false);

    // Filters — pending section
    const [onlyBookmarked, setOnlyBookmarked] = useState(false);
    const [jobSearch, setJobSearch] = useState('');
    const [pendingSearchQuery, setPendingSearchQuery] = useState('');
    const [pendingPage, setPendingPage] = useState(1);
    const pendingPageSize = 9;

    useEffect(() => {
        setPendingPage(1);
    }, [onlyBookmarked, jobSearch, pendingSearchQuery]);

    // Filter — interview list
    const [filterStatus, setFilterStatus] = useState<InterviewStatus | ''>('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const [appsRes, ivRes] = await Promise.all([
                fetch('/api/employer/applications?status=ACCEPTED').then(r => r.json()),
                fetch('/api/employer/interviews').then(r => r.json()),
            ]);

            const allApps: any[] = appsRes.applications ?? [];
            const allInterviews: Interview[] = ivRes.interviews ?? [];

            const existingInterviewAppIds = new Set(
                allInterviews.map(iv => iv.application.id)
            );

            const pending: ApprovedApplication[] = allApps
                .filter((app: any) => !existingInterviewAppIds.has(app.id))
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
        } catch (e) {
            console.error('Failed to load data', e);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: InterviewStatus) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/employer/interviews/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                setInterviews(prev => prev.map(iv => iv.id === id ? { ...iv, status } : iv));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUpdatingId(null);
        }
    };

    // Derived lists
    const filteredPending = pendingApps
        .filter(c => !onlyBookmarked || c.isBookmarked)
        .filter(c => !jobSearch || c.jobTitle.toLowerCase().includes(jobSearch.toLowerCase()))
        .filter(c => {
            if (!pendingSearchQuery) return true;
            const query = pendingSearchQuery.toLowerCase();
            return (
                c.name.toLowerCase().includes(query) ||
                c.email.toLowerCase().includes(query) ||
                (c.phone && c.phone.toLowerCase().includes(query))
            );
        });

    const totalPendingPages = Math.ceil(filteredPending.length / pendingPageSize);
    const paginatedPending = filteredPending.slice(
        (pendingPage - 1) * pendingPageSize,
        pendingPage * pendingPageSize
    );

    const filteredInterviews = interviews.filter(iv => !filterStatus || iv.status === filterStatus);

    const stats = {
        total: interviews.length,
        scheduled: interviews.filter(i => i.status === 'SCHEDULED').length,
        confirmed: interviews.filter(i => i.candidateStatus === 'CONFIRMED').length,
        pending: interviews.filter(i => i.candidateStatus === 'PENDING' && i.status === 'SCHEDULED').length,
    };

    return (
        <div className="space-y-6 w-full mx-auto px-4 py-6 text-slate-800 animate-fadeIn">
            {/* Elegant Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#0052CC] to-[#0040a2] rounded-3xl p-8 shadow-md text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_120%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-white/90">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Lịch hẹn tuyển dụng
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Quản lý Lịch phỏng vấn</h1>
                    <p className="text-sm text-white/80 max-w-xl">
                        Xem chi tiết danh sách lịch hẹn, theo dõi trạng thái phản hồi từ ứng viên và cập nhật tiến độ phỏng vấn.
                    </p>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng lịch', value: stats.total, icon: 'calendar_month', color: '#0052CC', bg: 'bg-[#EFF4FF]' },
                    { label: 'Sắp diễn ra', value: stats.scheduled, icon: 'event', color: '#FF8B00', bg: 'bg-[#FFFAE6]' },
                    { label: 'Đã xác nhận', value: stats.confirmed, icon: 'thumb_up', color: '#00875A', bg: 'bg-[#E3FCEF]' },
                    { label: 'Chờ phản hồi', value: stats.pending, icon: 'hourglass_empty', color: '#6554C0', bg: 'bg-[#EAE6FF]' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm hover:shadow transition-shadow">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                            <span className="material-symbols-outlined text-[24px]" style={{ color: s.color }}>{s.icon}</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800">{s.value}</p>
                            <p className="text-xs text-slate-400 font-bold">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Section 1: Ứng viên chờ đặt lịch ── */}
            {pendingApps.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/60 space-y-4">
                    {/* Header + filters */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-50 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-5 rounded-full bg-[#FF8B00]" />
                            <h2 className="font-extrabold text-slate-800 text-base">Ứng viên chờ đặt lịch</h2>
                            <span className="px-2.5 py-0.5 bg-[#FFFAE6] text-[#FF8B00] text-xs font-black rounded-full border border-[#FFE5A0]">
                                {filteredPending.length}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search input */}
                            <div className="relative">
                                <span className="material-symbols-outlined text-[16px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 font-bold">search</span>
                                <input
                                    type="text"
                                    placeholder="Tìm ứng viên..."
                                    value={pendingSearchQuery}
                                    onChange={e => setPendingSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 h-9 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#0052CC]/15 transition-all w-48 font-bold"
                                />
                            </div>

                            {/* Bookmark filter */}
                            <button
                                onClick={() => setOnlyBookmarked(v => !v)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${onlyBookmarked
                                    ? 'bg-amber-450 border-amber-450 text-white shadow-sm'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-amber-400 hover:text-amber-500'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[15px]">{onlyBookmarked ? 'bookmark' : 'bookmark_border'}</span>
                                Tiềm năng
                            </button>

                            {/* Job search select */}
                            <div className="relative">
                                <span className="material-symbols-outlined text-[16px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">work</span>
                                <select
                                    value={jobSearch}
                                    onChange={e => setJobSearch(e.target.value)}
                                    className="pl-9 pr-8 h-9 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#0052CC]/15 transition-all w-48 appearance-none cursor-pointer font-bold"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 8px center',
                                        backgroundSize: '12px'
                                    }}
                                >
                                    <option value="">Tất cả Job</option>
                                    {jobList.map(job => (
                                        <option key={job.id} value={job.title}>
                                            {job.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Pending candidates list */}
                    {filteredPending.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <span className="material-symbols-outlined text-4xl block mb-2 text-slate-200">search_off</span>
                            <p className="text-xs font-bold">Không tìm thấy ứng viên phù hợp</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {paginatedPending.map(c => (
                                    <div key={c.applicationId} className="bg-slate-50/50 rounded-2xl border border-dashed border-[#C7D9FF] p-4 flex items-center justify-between gap-3 hover:border-[#0052CC] hover:bg-white hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative w-11 h-11 flex-shrink-0">
                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0052CC] to-[#0040a2] flex items-center justify-center text-white font-black text-base overflow-hidden">
                                                    {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover" alt={c.name} /> : c.name[0]?.toUpperCase()}
                                                </div>
                                                {c.isBookmarked && (
                                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                                                        <span className="material-symbols-outlined text-[10px] text-white">bookmark</span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-extrabold text-slate-800 text-xs truncate">{c.name}</p>
                                                <p className="text-[10px] text-[#0052CC] font-bold truncate mt-0.5">{c.jobTitle}</p>
                                                <p className="text-[10px] text-slate-400 font-medium truncate">{c.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => router.push(`/employer/interviews/${c.applicationId}`)}
                                            className="h-8 px-3 inline-flex items-center gap-1 bg-[#0052CC] hover:bg-[#0040a2] text-white text-[11px] font-black rounded-lg transition-all flex-shrink-0 cursor-pointer shadow-sm active:scale-97"
                                        >
                                            <span className="material-symbols-outlined text-[13px] font-bold">add</span>
                                            Lên lịch
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPendingPages > 1 && (
                                <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-slate-50">
                                    <button
                                        onClick={() => setPendingPage(p => Math.max(1, p - 1))}
                                        disabled={pendingPage === 1}
                                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                    </button>

                                    {Array.from({ length: totalPendingPages }, (_, i) => i + 1).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setPendingPage(p)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${pendingPage === p
                                                ? 'bg-[#0052CC] text-white shadow-sm'
                                                : 'border border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setPendingPage(p => Math.min(totalPendingPages, p + 1))}
                                        disabled={pendingPage === totalPendingPages}
                                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── Section 2: Danh sách lịch phỏng vấn ── */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/60 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-50 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full bg-[#0052CC]" />
                        <h2 className="font-extrabold text-slate-800 text-base">Lịch phỏng vấn</h2>
                    </div>
                    <div className="flex flex-wrap gap-1 bg-slate-55 p-0.5 rounded-xl border border-slate-100">
                        {([['', 'Tất cả'], ['SCHEDULED', 'Đã lên lịch'], ['COMPLETED', 'Hoàn thành'], ['CANCELLED', 'Đã hủy']] as [string, string][]).map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => setFilterStatus(val as any)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterStatus === val
                                    ? 'bg-white text-[#0052CC] shadow-sm'
                                    : 'text-slate-400 hover:text-slate-650'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#0052CC] rounded-full animate-spin" />
                    </div>
                ) : filteredInterviews.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <span className="material-symbols-outlined text-4xl block mb-2 text-slate-200">event_busy</span>
                        <p className="text-xs font-bold">Chưa có lịch phỏng vấn nào cho bộ lọc này</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3.5">
                        {filteredInterviews.map(iv => {
                            const sCfg = STATUS_CFG[iv.status];
                            const cCfg = CANDIDATE_CFG[iv.candidateStatus];

                            return (
                                <div key={iv.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                    <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start md:items-center gap-4 min-w-0">
                                            <div
                                                className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0052CC] to-[#0040a2] flex items-center justify-center text-white font-black text-lg flex-shrink-0 cursor-pointer overflow-hidden shadow-sm"
                                                onClick={() => router.push(`/employer/interviews/${iv.application.id}`)}
                                            >
                                                {iv.application.user.avatar ? <img src={iv.application.user.avatar} className="w-full h-full object-cover" alt={iv.application.user.name} /> : iv.application.user.name[0]}
                                            </div>

                                            <div className="min-w-0 space-y-1">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                                    <p className="font-extrabold text-slate-800 text-sm">{iv.application.user.name}</p>
                                                    <span className="text-slate-300 hidden sm:inline">•</span>
                                                    <p className="text-xs text-[#0052CC] font-bold">{iv.application.job.title}</p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-bold">
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[15px]">schedule</span>
                                                        {formatDateTime(iv.scheduledAt)}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[15px]">
                                                            {iv.type === 'ONLINE' ? 'videocam' : 'location_on'}
                                                        </span>
                                                        {iv.type === 'ONLINE' ? 'Online' : 'Trực tiếp'}
                                                    </span>
                                                </div>
                                                {iv.location && (
                                                    <p className="text-xs text-slate-400 font-medium truncate max-w-lg mt-0.5">📍 {iv.location}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 bg-slate-50/70"
                                                style={{ color: sCfg.color, borderColor: sCfg.border }}>
                                                <span className="material-symbols-outlined text-[13px]">{sCfg.icon}</span>
                                                {sCfg.label}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 bg-slate-50/70"
                                                style={{ color: cCfg.color, borderColor: 'transparent' }}>
                                                <span className="material-symbols-outlined text-[13px]">{cCfg.icon}</span>
                                                {cCfg.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action footer */}
                                    <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {iv.candidateStatus === 'DECLINED' && iv.declineReason && (
                                                <div className="px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-700 font-bold">
                                                    Lý do từ chối: {iv.declineReason}
                                                </div>
                                            )}
                                            {iv.notes && (
                                                <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-500 font-bold truncate max-w-sm">
                                                    Ghi chú: {iv.notes}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {iv.status === 'SCHEDULED' && (
                                                <>
                                                    <button
                                                        onClick={() => router.push(`/employer/interviews/${iv.application.id}`)}
                                                        className="h-8 px-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#0052CC] border border-[#0052CC]/20 hover:bg-[#0052CC]/5 rounded-lg cursor-pointer transition-colors shadow-sm"
                                                    >
                                                        <span className="material-symbols-outlined text-[13px]">edit</span>
                                                        Sửa lịch
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(iv.id, 'COMPLETED')}
                                                        disabled={updatingId === iv.id}
                                                        className="h-8 px-3 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 border border-emerald-250 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-55"
                                                    >
                                                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                                        Hoàn thành
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(iv.id, 'CANCELLED')}
                                                        disabled={updatingId === iv.id}
                                                        className="h-8 px-3 inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 border border-rose-250 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-55"
                                                    >
                                                        <span className="material-symbols-outlined text-[13px]">cancel</span>
                                                        Hủy
                                                    </button>
                                                </>
                                            )}
                                            {iv.application.user.email && (
                                                <a href={`mailto:${iv.application.user.email}`} className="h-8 px-3 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-[#0052CC] hover:bg-white border border-slate-100 hover:border-slate-200 rounded-lg cursor-pointer transition-all shadow-sm">
                                                    <span className="material-symbols-outlined text-[13px]">mail</span>
                                                    Email
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
