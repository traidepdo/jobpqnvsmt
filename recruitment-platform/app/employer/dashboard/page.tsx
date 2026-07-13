'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase, Inbox, Mail, Calendar, Clock, Bell, Plus, Search,
  TrendingUp, TrendingDown, AlertTriangle, Eye,
  Pencil, Pause, CheckCircle2, XCircle, ChevronRight, X
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from "recharts";

type DashboardData = {
  activeJobs: number;
  totalApplications: number;
  todayApplications: number;
  expiringSoon: number;
  upcomingInterviews: number;
  companyApproved: boolean;
  companyName: string;
  recentJobs: {
    id: string;
    title: string;
    slug: string;
    status: string;
    applicants: number;
    views: number;
    deadline: string;
    urgent: boolean;
  }[];
  recentApplications: {
    id: string;
    name: string;
    role: string;
    date: string;
    status: string;
    score: number;
  }[];
  interviews: {
    id: string;
    name: string;
    role: string;
    time: string;
    date: string;
  }[];
  candidates: {
    id: string;
    name: string;
    role: string;
    match: number;
  }[];
  trendData: { day: string; don: number }[];
  funnelData: { stage: string; value: number }[];
};

const statusStyle: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "Chờ xem xét", bg: "#FEF3E2", text: "#B7791F" },
  reviewing: { label: "Đang xem xét", bg: "#EDE9FE", text: "#6D28D9" },
  accepted: { label: "Đã chấp nhận", bg: "#DCFCE7", text: "#15803D" },
  rejected: { label: "Từ chối", bg: "#FEE2E2", text: "#B91C1C" },
};

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(" ").slice(-2).map((w) => w[0]).join("");
  const hue = (name.charCodeAt(0) * 37) % 360;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: `hsl(${hue} 70% 92%)`, color: `hsl(${hue} 55% 35%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 600, fontSize: size * 0.38, flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, delta, deltaGood, accent, href }: {
  icon: any; label: string; value: string | number; delta?: string; deltaGood?: boolean;
  accent?: { border: string; bg: string; iconBg: string; iconColor: string }; href?: string;
}) {
  const cardContent = (
    <>
      <div className="stat-top">
        <span className="stat-icon" style={accent ? { background: accent.iconBg, color: accent.iconColor } : {}}>
          <Icon size={18} />
        </span>
        {delta != null && (
          <span className={`stat-delta ${deltaGood ? "up" : "down"}`}>
            {deltaGood ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {delta}
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="stat-card hover:shadow-md transition-all duration-200 cursor-pointer block" style={accent ? { borderColor: accent.border, background: accent.bg } : {}}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div className="stat-card" style={accent ? { borderColor: accent.border, background: accent.bg } : {}}>
      {cardContent}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-gray-200/60 animate-pulse rounded-2xl ${className}`} />;
}

export default function EmployerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");
  const [query, setQuery] = useState("");
  const [dismissedAlert, setDismissedAlert] = useState(false);

  useEffect(() => {
    fetch('/api/employer/stats')
      .then(r => {
        if (!r.ok) throw new Error('Unauthorized or server error');
        return r.json();
      })
      .then(setData)
      .catch(err => {
        console.error(err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAppStatus = async (appId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/employer/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            recentApplications: prev.recentApplications.map(app =>
              app.id === appId ? { ...app, status: status.toLowerCase() } : app
            )
          };
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="dash space-y-6">
        <Skeleton className="h-28" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="material-symbols-outlined text-[48px] text-gray-300 mb-3">error_outline</span>
        <p className="font-semibold text-gray-500">Không tải được dữ liệu</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-[#2554F0] text-white text-sm font-semibold rounded-lg hover:bg-[#1E44CC] transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const urgentJobs = data.recentJobs.filter((j) => j.urgent);
  const filteredJobs = data.recentJobs
    .filter((j) => (tab === "all" ? true : j.status === tab))
    .filter((j) => j.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="dash">
      <style>{`
        .dash { font-family: -apple-system, "Segoe UI", Inter, sans-serif; background: #F6F7FB; padding: 24px 24px; color: #1A1D29; min-height: 100vh; box-sizing: border-box; }
        .dash * { box-sizing: border-box; }
        .top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
        .greeting h1 { font-size: 22px; font-weight: 800; margin: 0 0 4px; color: #0f172a; }
        .greeting p { font-size: 13px; color: #64748b; margin: 0; }
        .top-actions { display: flex; align-items: center; gap: 10px; }
        .icon-btn { position: relative; width: 38px; height: 38px; border-radius: 10px; border: 1px solid #E5E7EB; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #4B5563; }
        .icon-btn:hover { background: #F3F4F6; }
        .badge-dot { position: absolute; top: 6px; right: 7px; width: 7px; height: 7px; border-radius: 50%; background: #EF4444; }
        .btn-primary { display: flex; align-items: center; gap: 6px; background: #2554F0; color: #fff; border: none; padding: 10px 16px; border-radius: 10px; font-size: 13.5px; font-weight: 600; cursor: pointer; text-decoration: none; }
        .btn-primary:hover { background: #1E44CC; }

        .alert-banner { display: flex; align-items: center; gap: 10px; background: #FEF2F2; border: 1px solid #FCA5A5; color: #B91C1C; padding: 12px 16px; border-radius: 12px; margin-bottom: 18px; font-size: 13.5px; }
        .alert-banner b { font-weight: 700; }
        .alert-banner .spacer { flex: 1; }
        .alert-link { color: #B91C1C; font-weight: 600; text-decoration: underline; cursor: pointer; background: none; border: none; font-size: 13.5px; }
        .alert-close { background: none; border: none; cursor: pointer; color: #B91C1C; padding: 2px; }

        .stat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 20px; }
        .stat-card { background: #fff; border: 1px solid #EEF0F4; border-radius: 14px; padding: 16px; text-decoration: none; color: inherit; }
        .stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .stat-icon { width: 32px; height: 32px; border-radius: 9px; background: #EEF2FF; color: #2554F0; display: flex; align-items: center; justify-content: center; }
        .stat-delta { font-size: 11.5px; font-weight: 700; display: flex; align-items: center; gap: 2px; }
        .stat-delta.up { color: #15803D; } .stat-delta.down { color: #B91C1C; }
        .stat-value { font-size: 24px; font-weight: 700; margin-bottom: 2px; }
        .stat-label { font-size: 12.5px; color: #6B7280; }

        .grid-2 { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; margin-bottom: 16px; align-items: start; }
        .card { background: #fff; border: 1px solid #EEF0F4; border-radius: 14px; padding: 18px 20px; }
        .card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .card-head h3 { font-size: 14.5px; font-weight: 700; margin: 0; }
        .link-btn { font-size: 12.5px; color: #2554F0; font-weight: 600; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 2px; text-decoration: none; }

        .tabs { display: flex; gap: 6px; margin-bottom: 12px; }
        .tab-btn { font-size: 12.5px; padding: 6px 12px; border-radius: 8px; border: 1px solid transparent; background: #F3F4F6; color: #6B7280; cursor: pointer; font-weight: 600; }
        .tab-btn.active { background: #EEF2FF; color: #2554F0; }
        .search-box { display: flex; align-items: center; gap: 6px; background: #F3F4F6; border-radius: 8px; padding: 6px 10px; margin-bottom: 12px; }
        .search-box input { border: none; background: none; outline: none; font-size: 13px; width: 100%; }

        .job-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #F1F2F6; }
        .job-row:last-child { border-bottom: none; }
        .job-main { flex: 1; min-width: 0; }
        .job-title-row { display: flex; align-items: center; gap: 6px; }
        .job-title { font-size: 13.5px; font-weight: 600; margin: 0; color: #0f172a; text-decoration: none; }
        .job-title:hover { color: #2554F0; }
        .job-meta { font-size: 12px; color: #6B7280; margin: 3px 0 0; display: flex; gap: 10px; flex-wrap: wrap; }
        .pill { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
        .pill.active { background: #DCFCE7; color: #15803D; }
        .pill.paused { background: #F3F4F6; color: #6B7280; }
        .pill.expired { background: #FEE2E2; color: #B91C1C; }
        .pill.urgent { background: #FEF3E2; color: #B7791F; }
        .row-actions { display: flex; gap: 6px; }
        .mini-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid #E5E7EB; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #4B5563; text-decoration: none; }
        .mini-btn:hover { background: #F3F4F6; }

        .app-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #F1F2F6; }
        .app-row:last-child { border-bottom: none; }
        .app-name { font-size: 13.5px; font-weight: 600; margin: 0; }
        .app-role { font-size: 12px; color: #6B7280; margin: 2px 0 0; }
        .status-pill { font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 999px; white-space: nowrap; }
        .score { font-size: 11.5px; font-weight: 700; color: #2554F0; margin-left: auto; margin-right: 4px; }
        .quick-actions { display: flex; gap: 4px; }
        .accept-btn, .reject-btn { width: 26px; height: 26px; border-radius: 7px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .accept-btn { background: #DCFCE7; color: #15803D; } .reject-btn { background: #FEE2E2; color: #B91C1C; }

        .side-col { display: flex; flex-direction: column; gap: 16px; }
        .interview-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: #F8F9FC; border-radius: 10px; margin-bottom: 8px; }
        .interview-time { font-size: 12px; font-weight: 700; color: #2554F0; background: #EEF2FF; padding: 4px 8px; border-radius: 7px; }
        .empty-hint { font-size: 12.5px; color: #9CA3AF; padding: 8px 0; }

        .cand-item { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #F1F2F6; }
        .cand-item:last-child { border-bottom: none; }
        .match-chip { margin-left: auto; font-size: 11px; font-weight: 700; color: #2554F0; background: #EEF2FF; padding: 3px 8px; border-radius: 999px; }

        @media (max-width: 900px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
          .grid-2 { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Banner chờ duyệt */}
      {!data.companyApproved && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start mb-6">
          <span className="material-symbols-outlined text-amber-500 flex-shrink-0">info</span>
          <div>
            <p className="font-semibold text-amber-900 text-sm">Công ty đang chờ phê duyệt</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Sau khi admin duyệt, bạn có thể đăng tin tuyển dụng công khai.
            </p>
          </div>
        </div>
      )}

      <div className="top-row">
        <div className="greeting">
          <h1>Xin chào, {data.companyName || 'Doanh nghiệp'} 👋</h1>
          <p>Tổng quan hoạt động tuyển dụng của bạn hôm nay</p>
        </div>
        <div className="top-actions">
          <Link href="/employer/jobs/new" className="btn-primary"><Plus size={16} /> Đăng tin mới</Link>
        </div>
      </div>

      {!dismissedAlert && urgentJobs.length > 0 && (
        <div className="alert-banner">
          <AlertTriangle size={17} />
          <span><b>{urgentJobs.length} tin tuyển dụng</b> sắp hết hạn trong vòng 3 ngày tới</span>
          <span className="spacer" />
          <button className="alert-link" onClick={() => setTab("active")}>Xem ngay</button>
          <button className="alert-close" onClick={() => setDismissedAlert(true)}><X size={15} /></button>
        </div>
      )}

      <div className="stat-grid">
        <StatCard icon={Briefcase} label="Tin đang tuyển" value={data.activeJobs} href="/employer/jobs" />
        <StatCard icon={Inbox} label="Tổng đơn ứng tuyển" value={data.totalApplications} href="/employer/applications" />
        <StatCard
          icon={Mail} label="Đơn mới hôm nay" value={data.todayApplications} href="/employer/applications?status=PENDING"
          accent={{ border: "#DBEAFE", bg: "#F5F8FF", iconBg: "#DBEAFE", iconColor: "#2554F0" }}
        />
        <StatCard icon={Calendar} label="Lịch phỏng vấn sắp tới" value={data.upcomingInterviews} href="/employer/interviews" />
        <StatCard
          icon={Clock} label="Tin sắp hết hạn" value={data.expiringSoon} href="/employer/jobs"
          accent={{ border: "#FDE68A", bg: "#FFFBEB", iconBg: "#FEF3C7", iconColor: "#B7791F" }}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Xu hướng đơn ứng tuyển (7 ngày)</h3>
            <Link href="/employer/applications" className="link-btn">Chi tiết <ChevronRight size={14} /></Link>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data.trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2554F0" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2554F0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F1F5" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #EEF0F4" }} />
              <Area type="monotone" dataKey="don" stroke="#2554F0" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Phễu tuyển dụng</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.funnelData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="stage" type="category" width={70} tick={{ fontSize: 11.5, fill: "#4B5563" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #EEF0F4" }} />
              <Bar dataKey="value" fill="#2554F0" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Tin tuyển dụng</h3>
            <Link href="/employer/jobs" className="link-btn">Xem tất cả <ChevronRight size={14} /></Link>
          </div>
          <div className="tabs">
            {[["active", "Đang tuyển"], ["paused", "Tạm dừng"], ["expired", "Hết hạn"], ["all", "Tất cả"]].map(([k, l]) => (
              <button key={k} className={`tab-btn ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
          <div className="search-box">
            <Search size={14} color="#9CA3AF" />
            <input placeholder="Tìm tin tuyển dụng..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {filteredJobs.length === 0 && <p className="empty-hint">Không có tin nào phù hợp.</p>}
          {filteredJobs.map((job) => (
            <div className="job-row" key={job.id}>
              <div className="job-main">
                <div className="job-title-row">
                  <Link href={`/employer/jobs/${job.id}/edit`} className="job-title">{job.title}</Link>
                  {job.urgent && <span className="pill urgent">Sắp hết hạn</span>}
                </div>
                <div className="job-meta">
                  <span>{job.applicants} đơn ứng tuyển</span>
                  <span>{job.views} lượt xem</span>
                  <span>Hạn {job.deadline}</span>
                </div>
              </div>
              <span className={`pill ${job.status}`}>
                {job.status === "active" ? "Đang tuyển" : job.status === "expired" ? "Hết hạn" : "Tạm dừng"}
              </span>
              <div className="row-actions">
                <Link href={`/employer/applications?jobId=${job.id}`} className="mini-btn" title="Xem đơn"><Eye size={14} /></Link>
                <Link href={`/employer/jobs/${job.id}/edit`} className="mini-btn" title="Sửa tin"><Pencil size={14} /></Link>
              </div>
            </div>
          ))}
        </div>

        <div className="side-col">
          <div className="card">
            <div className="card-head">
              <h3>Lịch phỏng vấn</h3>
              <Link href="/employer/interviews" className="link-btn">Lịch <ChevronRight size={14} /></Link>
            </div>
            {data.interviews.length === 0 && <p className="empty-hint">Chưa có lịch phỏng vấn nào.</p>}
            {data.interviews.map((iv) => (
              <div className="interview-item" key={iv.id}>
                <Avatar name={iv.name} size={32} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{iv.name}</p>
                  <p style={{ fontSize: 11.5, color: "#6B7280", margin: "2px 0 0" }}>{iv.role}</p>
                </div>
                <span className="interview-time">{iv.time}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Ứng viên tiềm năng</h3>
              <Link href="/employer/applications" className="link-btn">Xem tất cả <ChevronRight size={14} /></Link>
            </div>
            {data.candidates.length === 0 && <p className="empty-hint">Chưa có ứng viên tiềm năng.</p>}
            {data.candidates.map((c) => (
              <div className="cand-item" key={c.id}>
                <Avatar name={c.name} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{c.name}</p>
                  <p style={{ fontSize: 11.5, color: "#6B7280", margin: "2px 0 0" }}>{c.role}</p>
                </div>
                <span className="match-chip">{c.match}% phù hợp</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Đơn ứng tuyển mới</h3>
          <Link href="/employer/applications" className="link-btn">Xem tất cả <ChevronRight size={14} /></Link>
        </div>
        {data.recentApplications.length === 0 && <p className="empty-hint">Không có đơn ứng tuyển mới nào.</p>}
        {data.recentApplications.map((app) => {
          const s = statusStyle[app.status] || { label: app.status, bg: "#F3F4F6", text: "#6B7280" };
          return (
            <div className="app-row" key={app.id}>
              <Avatar name={app.name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="app-name">{app.name}</p>
                <p className="app-role">{app.role} · {app.date}</p>
              </div>
              <span className="score">{app.score}đ</span>
              <span className="status-pill" style={{ background: s.bg, color: s.text }}>{s.label}</span>
              {app.status !== "accepted" && app.status !== "rejected" && (
                <div className="quick-actions">
                  <button className="accept-btn" title="Chấp nhận" onClick={() => handleAppStatus(app.id, 'ACCEPTED')}><CheckCircle2 size={14} /></button>
                  <button className="reject-btn" title="Từ chối" onClick={() => handleAppStatus(app.id, 'REJECTED')}><XCircle size={14} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
