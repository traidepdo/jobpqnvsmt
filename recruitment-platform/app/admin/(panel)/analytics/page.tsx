'use client';

// app/admin/analytics/page.tsx
import { useEffect, useState } from 'react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────
interface SeriesPoint { date: string; count: number }
interface TopJob { id: string; title: string; company: string; logo?: string | null; count: number }
interface Summary { totalJobs: number; totalApps: number; totalUsers: number; totalCompanies: number }
interface AnalyticsData {
    range: number;
    summary: Summary;
    series: { jobs: SeriesPoint[]; applications: SeriesPoint[]; users: SeriesPoint[] };
    topJobs: TopJob[];
}

// ── Helpers ────────────────────────────────────────────────────
function fmtDate(iso: string, range: number) {
    const d = new Date(iso);
    if (range <= 7) return d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' });
    return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
}

function jobsSeries(data: AnalyticsData, range: number) {
    return data.series.jobs.map(j => ({
        label: fmtDate(j.date, range),
        'Tin đăng': j.count,
    }));
}

const STAT_CARDS = [
    { key: 'totalJobs', label: 'Tin tuyển dụng', icon: '◷', color: '#6366f1', bg: 'from-indigo-500/10 to-indigo-500/5' },
    { key: 'totalApps', label: 'Đơn ứng tuyển', icon: '◉', color: '#0ea5e9', bg: 'from-sky-500/10 to-sky-500/5' },
    { key: 'totalUsers', label: 'Người dùng mới', icon: '◈', color: '#10b981', bg: 'from-emerald-500/10 to-emerald-500/5' },
    { key: 'totalCompanies', label: 'Doanh nghiệp', icon: '⬡', color: '#f59e0b', bg: 'from-amber-500/10 to-amber-500/5' },
];

const RANGES = [
    { label: '7 ngày', value: 7 },
    { label: '30 ngày', value: 30 },
    { label: '90 ngày', value: 90 },
];

// ── Custom Tooltip ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#0f1120] border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-sm">
            <p className="text-white/50 text-xs mb-2">{label}</p>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                <span className="text-white/70">Tin đăng:</span>
                <span className="text-white font-bold">{payload[0]?.value}</span>
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
    const [range, setRange] = useState(30);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/admin/analytics?range=${range}`)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [range]);

    const maxCount = data ? Math.max(...data.topJobs.map(j => j.count), 1) : 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white">Thống kê hệ thống</h1>
                    <p className="text-white/40 text-sm mt-0.5">Dữ liệu tổng hợp theo thời gian thực</p>
                </div>
                <div className="flex gap-1 p-1 bg-white/[0.05] border border-white/[0.08] rounded-xl">
                    {RANGES.map(r => (
                        <button
                            key={r.value}
                            onClick={() => setRange(r.value)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${range === r.value
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-white/40 hover:text-white/70'
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {STAT_CARDS.map(card => {
                    const val = data?.summary[card.key as keyof Summary] ?? 0;
                    return (
                        <div
                            key={card.key}
                            className={`relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br ${card.bg} p-5`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-white/40 text-xs font-medium uppercase tracking-wider">{card.label}</p>
                                    {loading ? (
                                        <div className="h-8 w-20 bg-white/5 rounded-lg mt-2 animate-pulse" />
                                    ) : (
                                        <p className="text-3xl font-black text-white mt-1 tabular-nums">
                                            {val.toLocaleString('vi-VN')}
                                        </p>
                                    )}
                                </div>
                                <span
                                    className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: card.color + '22', color: card.color }}
                                >
                                    {card.icon}
                                </span>
                            </div>
                            <div
                                className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-10 blur-2xl"
                                style={{ background: card.color }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Area Chart - Jobs only */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#060810]/80 p-6">
                <div className="mb-6">
                    <h2 className="font-bold text-white text-sm">Tin tuyển dụng mới</h2>
                    <p className="text-white/30 text-xs mt-0.5">{range} ngày gần nhất</p>
                </div>

                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="w-8 h-8 border-[3px] border-white/10 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                ) : data ? (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={jobsSeries(data, range)} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                            <defs>
                                <linearGradient id="grad-jobs" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                                axisLine={false} tickLine={false}
                                interval={range <= 7 ? 0 : range <= 30 ? 3 : 8}
                            />
                            <YAxis
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                                axisLine={false} tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="Tin đăng"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fill="url(#grad-jobs)"
                                dot={false}
                                activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : null}
            </div>

            {/* Top Jobs */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#060810]/80 p-6">
                <div className="mb-5">
                    <h2 className="font-bold text-white text-sm">Top tin tuyển dụng nhiều ứng tuyển nhất</h2>
                    <p className="text-white/30 text-xs mt-0.5">Trong {range} ngày gần nhất</p>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-14 bg-white/[0.03] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : !data?.topJobs.length ? (
                    <p className="text-white/30 text-sm text-center py-10">Chưa có dữ liệu</p>
                ) : (
                    <div className="space-y-2.5">
                        {data.topJobs.map((job, idx) => {
                            const pct = Math.round((job.count / maxCount) * 100);
                            const medals = ['🥇', '🥈', '🥉'];
                            return (
                                <div
                                    key={job.id}
                                    className="group flex items-center gap-4 p-3.5 rounded-xl border border-white/[0.05] hover:border-white/10 hover:bg-white/[0.03] transition-all"
                                >
                                    <div className="w-7 text-center flex-shrink-0">
                                        {idx < 3
                                            ? <span className="text-lg">{medals[idx]}</span>
                                            : <span className="text-white/30 text-sm font-bold">#{idx + 1}</span>
                                        }
                                    </div>

                                    {job.logo ? (
                                        <img
                                            src={job.logo}
                                            alt=""
                                            className="w-9 h-9 rounded-lg object-contain bg-white/5 border border-white/10 flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm flex-shrink-0">
                                            {job.company[0]}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <div className="min-w-0">
                                                <p className="text-white text-sm font-semibold truncate">{job.title}</p>
                                                <p className="text-white/40 text-xs truncate">{job.company}</p>
                                            </div>
                                            <span className="flex-shrink-0 text-sm font-black text-indigo-400 tabular-nums">
                                                {job.count} <span className="text-white/30 font-normal text-xs">đơn</span>
                                            </span>
                                        </div>
                                        <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                    width: `${pct}%`,
                                                    background: idx === 0
                                                        ? 'linear-gradient(90deg, #6366f1, #818cf8)'
                                                        : idx === 1
                                                            ? 'linear-gradient(90deg, #0ea5e9, #38bdf8)'
                                                            : 'linear-gradient(90deg, #10b981, #34d399)',
                                                }}
                                            />
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