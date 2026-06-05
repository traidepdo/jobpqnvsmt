'use client';
// app/admin/dashboard/page.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User { id: string; name: string; email: string; role: string }

interface DashboardData {
    summary: {
        totalUsers: number;
        totalCompanies: number;
        totalJobs: number;
        totalApplications: number;
    };
    pendingCompanies: { id: string; name: string; industry: string | null; createdAt: string }[];
    pendingJobs: { id: string; title: string; company: { name: string }; status: string; createdAt: string }[];
    pendingJobsCount: number;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    PENDING: { label: 'Chờ duyệt', cls: 'bg-amber-500/10 text-amber-400' },
    ACTIVE: { label: 'Đang tuyển', cls: 'bg-emerald-500/10 text-emerald-400' },
    REJECTED: { label: 'Từ chối', cls: 'bg-red-500/10 text-red-400' },
    DRAFT: { label: 'Nháp', cls: 'bg-white/5 text-white/40' },
    CLOSED: { label: 'Đã đóng', cls: 'bg-white/5 text-white/40' },
};

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export default function AdminDashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [approvingCo, setApprovingCo] = useState<string | null>(null);
    const [approvingJob, setApprovingJob] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.json())
            .then(d => { if (d.user) setUser(d.user); else router.push('/admin/login'); })
            .catch(() => router.push('/admin/login'));
    }, []);

    const loadDashboard = () => {
        fetch('/api/admin/dashboard')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { loadDashboard(); }, []);

    const handleApproveCompany = async (id: string, approve: boolean) => {
        setApprovingCo(id);
        await fetch(`/api/admin/companies/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approved: approve }),
        });
        setApprovingCo(null);
        loadDashboard();
    };

    const handleApproveJob = async (id: string, approve: boolean) => {
        setApprovingJob(id);
        await fetch(`/api/admin/jobs/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: approve ? 'ACTIVE' : 'REJECTED' }),
        });
        setApprovingJob(null);
        loadDashboard();
    };

    const today = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const STAT_CARDS = [
        { label: 'Tổng người dùng', value: data?.summary.totalUsers, icon: '◉', color: 'text-indigo-400', bg: 'bg-indigo-500/10', ring: 'ring-indigo-500/20' },
        { label: 'Doanh nghiệp', value: data?.summary.totalCompanies, icon: '⬡', color: 'text-sky-400', bg: 'bg-sky-500/10', ring: 'ring-sky-500/20' },
        { label: 'Tin tuyển dụng', value: data?.summary.totalJobs, icon: '◷', color: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
        { label: 'Đơn ứng tuyển', value: data?.summary.totalApplications, icon: '▤', color: 'text-amber-400', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20' },
    ];

    return (
        <div className="space-y-7">

            {/* ── WELCOME BANNER ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 p-7 shadow-[0_8px_32px_rgba(99,102,241,0.3)]">
                <div className="absolute right-0 top-0 h-full w-64 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent)] pointer-events-none" />
                <div className="absolute -bottom-6 -right-6 w-40 h-40 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full border border-white/[0.06] pointer-events-none" />
                <div className="relative z-10">
                    <p className="text-indigo-200 text-sm mb-1">{today}</p>
                    <h2 className="text-white text-xl font-bold mb-2">
                        Xin chào, {user?.name || 'Admin'} 👋
                    </h2>
                    <p className="text-indigo-200 text-sm leading-relaxed">
                        {loading ? 'Đang tải dữ liệu...' : (
                            <>
                                Có{' '}
                                <span className="text-white font-semibold">{data?.pendingCompanies.length ?? 0} doanh nghiệp</span> và{' '}
                                <span className="text-white font-semibold">{data?.pendingJobsCount ?? 0} tin tuyển dụng</span>{' '}
                                đang chờ duyệt.
                            </>
                        )}
                    </p>
                </div>
            </div>

            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {STAT_CARDS.map(card => (
                    <div key={card.label} className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5 hover:border-white/[0.14] hover:bg-white/[0.05] transition-all">
                        <div className={`w-11 h-11 rounded-xl ${card.bg} ring-1 ${card.ring} flex items-center justify-center ${card.color} text-lg mb-4`}>
                            {card.icon}
                        </div>
                        {loading ? (
                            <div className="h-8 w-20 bg-white/5 rounded-lg animate-pulse mb-0.5" />
                        ) : (
                            <div className="text-2xl font-extrabold text-white tracking-tight mb-0.5">
                                {(card.value ?? 0).toLocaleString('vi-VN')}
                            </div>
                        )}
                        <div className="text-sm text-white/40">{card.label}</div>
                    </div>
                ))}
            </div>

            {/* ── TWO COLUMN ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Pending companies */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
                        <h3 className="font-bold text-[15px] text-white">Doanh nghiệp chờ duyệt</h3>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400">
                            {data?.pendingCompanies.length ?? 0} chờ
                        </span>
                    </div>
                    <div className="p-4 flex flex-col gap-3 min-h-[100px]">
                        {loading ? (
                            [...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white/[0.03] rounded-xl animate-pulse" />)
                        ) : !data?.pendingCompanies.length ? (
                            <p className="text-white/30 text-sm text-center py-6">Không có doanh nghiệp chờ duyệt</p>
                        ) : (
                            data.pendingCompanies.map(c => (
                                <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                                    <div className="min-w-0">
                                        <div className="text-[13.5px] font-semibold text-white truncate">{c.name}</div>
                                        <div className="text-[12px] text-white/35 mt-0.5">{c.industry ?? 'Chưa rõ ngành'} · {fmtDate(c.createdAt)}</div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleApproveCompany(c.id, true)}
                                            disabled={approvingCo === c.id}
                                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[12px] font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                        >
                                            ✓ Duyệt
                                        </button>
                                        <button
                                            onClick={() => handleApproveCompany(c.id, false)}
                                            disabled={approvingCo === c.id}
                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[12px] font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                        >
                                            ✕ Từ chối
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="px-6 pb-4">
                        <Link href="/admin/companies" className="block text-center py-2.5 rounded-xl border border-white/[0.07] text-white/35 text-sm hover:text-white/70 hover:border-white/15 hover:bg-white/[0.03] transition-all">
                            Xem tất cả doanh nghiệp →
                        </Link>
                    </div>
                </div>

                {/* Pending jobs */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
                        <h3 className="font-bold text-[15px] text-white">Tin tuyển dụng chờ duyệt</h3>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400">
                            {data?.pendingJobsCount ?? 0} chờ
                        </span>
                    </div>
                    <div className="p-4 flex flex-col gap-3 min-h-[100px]">
                        {loading ? (
                            [...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white/[0.03] rounded-xl animate-pulse" />)
                        ) : !data?.pendingJobs.length ? (
                            <p className="text-white/30 text-sm text-center py-6">Không có tin chờ duyệt</p>
                        ) : (
                            data.pendingJobs.map(j => (
                                <div key={j.id} className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                                    <div className="min-w-0">
                                        <div className="text-[13.5px] font-semibold text-white truncate">{j.title}</div>
                                        <div className="text-[12px] text-white/35 mt-0.5">{j.company.name} · {fmtDate(j.createdAt)}</div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleApproveJob(j.id, true)}
                                            disabled={approvingJob === j.id}
                                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[12px] font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                        >
                                            ✓ Duyệt
                                        </button>
                                        <button
                                            onClick={() => handleApproveJob(j.id, false)}
                                            disabled={approvingJob === j.id}
                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[12px] font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                        >
                                            ✕ Từ chối
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="px-6 pb-4">
                        <Link href="/admin/jobs" className="block text-center py-2.5 rounded-xl border border-white/[0.07] text-white/35 text-sm hover:text-white/70 hover:border-white/15 hover:bg-white/[0.03] transition-all">
                            Xem tất cả tin đăng →
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── QUICK ACTIONS ── */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-6">
                <h3 className="font-bold text-[15px] text-white mb-4">Thao tác nhanh</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { icon: '⬡', label: 'Duyệt doanh nghiệp', href: '/admin/companies', color: 'text-sky-400 bg-sky-500/10 ring-sky-500/20' },
                        { icon: '◷', label: 'Duyệt tin đăng', href: '/admin/jobs', color: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20' },
                        { icon: '◉', label: 'Quản lý người dùng', href: '/admin/users', color: 'text-indigo-400 bg-indigo-500/10 ring-indigo-500/20' },
                        { icon: '◎', label: 'Thống kê', href: '/admin/analytics', color: 'text-amber-400 bg-amber-500/10 ring-amber-500/20' },
                    ].map((a, i) => (
                        <Link key={i} href={a.href} className="flex flex-col items-center gap-3 py-5 px-3 rounded-xl border border-white/[0.07] hover:border-white/[0.15] hover:bg-white/[0.04] transition-all group">
                            <div className={`w-10 h-10 rounded-xl ring-1 flex items-center justify-center text-lg ${a.color} group-hover:-translate-y-0.5 transition-transform`}>
                                {a.icon}
                            </div>
                            <span className="text-[12.5px] text-white/50 group-hover:text-white/80 transition-colors text-center font-medium leading-tight">
                                {a.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

        </div>
    );
}