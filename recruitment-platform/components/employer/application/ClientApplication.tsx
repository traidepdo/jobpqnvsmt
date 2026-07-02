'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CandidateDetailsModal from '@/components/employer/application/CandidateDetailsModal';
import { formatDateVi, getApplicationStatusLabel } from '@/lib/jobLabels';
import { parseResumeJson, type EducationItem, type ExperienceItem } from '@/lib/renderResume';
import type { Application } from '@/lib/types/employer/application';
import { statusStyle, getStatusActions, actionBtnStyle, actionLabel } from '@/lib/jobLabelsApplication';
import EmailTemplateModal from '@/components/employer/application/EmailTemplateModal';

export default function EmployerApplicationsPage({
    applications,
    pagination,
    searchParams
}: {
    applications: Application[];
    pagination: { page: number; limit: number; total: number };
    searchParams: { page?: string; search?: string; category?: string; status?: string; isVisible?: string; query?: string }
}) {
    const router = useRouter();
    const [apps, setApps] = useState<Application[]>(applications || []);
    const [filter, setFilter] = useState(searchParams?.status || '');
    const [loading, setLoading] = useState(false);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [filterCategory, setFilterCategory] = useState(searchParams?.category || '');
    const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
    const [filterJob, setFilterJob] = useState('');
    const [query, setQuery] = useState(searchParams?.query || '');
    
    // Email template states
    const [emailModal, setEmailModal] = useState<{
        appId: string;
        candidateName: string;
        jobTitle: string;
        companyName: string;
        status: 'ACCEPTED' | 'REJECTED';
    } | null>(null);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkModal, setBulkModal] = useState<{ status: 'ACCEPTED' | 'REJECTED' } | null>(null);
    const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);
    const [visiblePages, setVisiblePages] = useState<Record<string, number>>({
        PENDING: 1,
        REVIEWING: 1,
        ACCEPTED: 1,
        REJECTED: 1
    });

    const toggleColumnCollapse = (colStatus: string) => {
        setCollapsedColumns(prev =>
            prev.includes(colStatus)
                ? prev.filter(c => c !== colStatus)
                : [...prev, colStatus]
        );
    };

    const handleEvaluate = async (id: string) => {
        setEvaluatingId(id);
        try {
            const res = await fetch(`/api/employer/applications/${id}/evaluate`, {
                method: 'POST',
            });
            if (res.ok) {
                const data = await res.json();
                setApps(prev =>
                    prev.map(app =>
                        app.id === id ? { ...app, matchScore: data.score } : app
                    )
                );
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Lỗi khi chấm điểm CV.');
            }
        } catch (e) {
            console.error(e);
            alert('Không thể kết nối đến máy chủ.');
        } finally {
            setEvaluatingId(null);
        }
    };

    useEffect(() => {
        setApps(applications || []);
        setLoading(false);
    }, [applications]);

    useEffect(() => {
        const queryParams = new URLSearchParams();
        if (filter) queryParams.set('status', filter);
        if (filterCategory) queryParams.set('category', filterCategory);
        if (filterJob) queryParams.set('jobId', filterJob);
        if (searchParams?.query) queryParams.set('query', searchParams.query);

        const queryString = queryParams.toString();
        router.push(`/employer/applications${queryString ? `?${queryString}` : ''}`);
    }, [filter, filterCategory, filterJob, router, searchParams?.query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const queryParams = new URLSearchParams();
        if (filter) queryParams.set('status', filter);
        if (filterCategory) queryParams.set('category', filterCategory);
        if (filterJob) queryParams.set('jobId', filterJob);
        if (query) queryParams.set('query', query);
        queryParams.set('page', '1');

        router.push(`/employer/applications?${queryParams.toString()}`);
    };

    const handlePageChange = (p: number) => {
        const queryParams = new URLSearchParams();
        if (filter) queryParams.set('status', filter);
        if (filterCategory) queryParams.set('category', filterCategory);
        if (filterJob) queryParams.set('jobId', filterJob);
        if (query) queryParams.set('query', query);
        queryParams.set('page', String(p));

        router.push(`/employer/applications?${queryParams.toString()}`);
    };

    useEffect(() => {
        fetch('/api/user/category')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setCategories(data);
            })
            .catch(err => console.error(err));

        fetch('/api/employer/jobs?limit=100')
            .then(r => r.json())
            .then(data => {
                if (data && Array.isArray(data.jobs)) setJobs(data.jobs);
            })
            .catch(err => console.error(err));
    }, []);

    const updateStatus = async (id: string, status: string, autoNavigate = false) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/employer/applications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                const d = await res.json();
                const newConvId: string | null = d.conversationId ?? null;

                setApps(prev =>
                    prev.map(a =>
                        a.id === id
                            ? { ...a, status: d.application.status, conversationId: newConvId ?? a.conversationId }
                            : a
                    )
                );

                if (autoNavigate && newConvId) {
                    router.push(`/employer/messages?id=${newConvId}`);
                }
            }
        } finally {
            setUpdatingId(null);
        }
    };

    const handleStatusChangeClick = (appId: string, status: string, autoNavigate = false) => {
        if (status === 'ACCEPTED' || status === 'REJECTED') {
            const app = apps.find(a => a.id === appId);
            if (app) {
                setEmailModal({
                    appId,
                    candidateName: app.user.name,
                    jobTitle: app.job.title,
                    companyName: app.job.company?.name || 'Công ty tuyển dụng',
                    status: status,
                });
                return;
            }
        }
        updateStatus(appId, status, autoNavigate);
    };

    const handleSendEmailAndChangeStatus = async (subject: string, body: string) => {
        if (!emailModal) return;
        setSendingEmail(true);
        try {
            const emailRes = await fetch(`/api/employer/applications/${emailModal.appId}/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, body }),
            });
            if (emailRes.ok) {
                await updateStatus(emailModal.appId, emailModal.status);
                setEmailModal(null);
            } else {
                const err = await emailRes.json();
                alert(err.error || 'Lỗi khi gửi email.');
            }
        } catch (e) {
            console.error(e);
            alert('Không thể kết nối đến máy chủ.');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleBulkStatusUpdateClick = (status: 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED') => {
        if (status === 'ACCEPTED' || status === 'REJECTED') {
            setBulkModal({ status });
        } else {
            executeBulkStatusUpdate(status);
        }
    };

    const executeBulkStatusUpdate = async (status: string, emailSubject?: string, emailBody?: string) => {
        setUpdatingId('bulk');
        try {
            for (const id of selectedIds) {
                const app = apps.find(a => a.id === id);
                if (!app) continue;

                const res = await fetch(`/api/employer/applications/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status }),
                });

                if (res.ok) {
                    const d = await res.json();
                    
                    if ((status === 'ACCEPTED' || status === 'REJECTED') && emailSubject && emailBody) {
                        const companyName = app.job.company?.name || 'Chúng tôi';
                        const interpolatedSubject = emailSubject
                            .replace(/{ten_ung_vien}/g, app.user.name)
                            .replace(/{ten_cong_viec}/g, app.job.title)
                            .replace(/{ten_cong_ty}/g, companyName);
                        const interpolatedBody = emailBody
                            .replace(/{ten_ung_vien}/g, app.user.name)
                            .replace(/{ten_cong_viec}/g, app.job.title)
                            .replace(/{ten_cong_ty}/g, companyName);

                        await fetch(`/api/employer/applications/${id}/send-email`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                subject: interpolatedSubject,
                                body: interpolatedBody,
                            }),
                        });
                    }

                    setApps(prev =>
                        prev.map(a =>
                            a.id === id
                                ? { ...a, status: d.application.status }
                                : a
                        )
                    );
                }
            }
            setSelectedIds([]);
            setBulkModal(null);
        } catch (error) {
            console.error('Lỗi cập nhật hàng loạt:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDragStart = (e: React.DragEvent, appId: string) => {
        e.dataTransfer.setData('text/plain', appId);
    };

    const handleDrop = (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault();
        const appId = e.dataTransfer.getData('text/plain');
        if (!appId) return;

        const app = apps.find(a => a.id === appId);
        if (!app || app.status === targetStatus) return;

        handleStatusChangeClick(appId, targetStatus);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleBookmark = async (id: string) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/employer/applications/${id}/bookmark`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });

            if (res.ok) {
                const data = await res.json();
                setApps(prev =>
                    prev.map(app =>
                        app.id === id ? { ...app, isBookmarked: data.isBookmarked } : app
                    )
                );
            } else {
                const errorData = await res.json();
                console.error("Lỗi từ server:", errorData.error);
                alert(errorData.error || "Không thể cập nhật trạng thái ứng viên.");
            }
        } catch (error) {
            console.error("Lỗi kết nối mạng:", error);
        } finally {
            setUpdatingId(null);
        }
    };

    const statusBadgeStyle: Record<string, { bg: string; text: string; icon: string }> = {
        PENDING: { bg: 'bg-amber-50', text: 'text-amber-850', icon: 'hourglass_empty' },
        REVIEWING: { bg: 'bg-indigo-55', text: 'text-indigo-850', icon: 'visibility' },
        ACCEPTED: { bg: 'bg-emerald-50', text: 'text-emerald-850', icon: 'check_circle' },
        REJECTED: { bg: 'bg-rose-50', text: 'text-rose-850', icon: 'cancel' },
    };

    return (
        <div className="space-y-6 w-full mx-auto px-4 py-6 text-slate-800 animate-fadeIn">
            {/* Redesigned clean header without borders, themed with #0052CC */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#0052CC] to-[#0040a2] rounded-3xl p-8 shadow-md text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_120%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-white/90">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Workspace Nhà tuyển dụng
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">
                        Quản lý Hồ sơ Ứng tuyển
                    </h1>
                    <p className="text-sm text-white/80 max-w-xl">
                        Theo dõi danh sách ứng tuyển, đánh giá năng lực AI, quản lý trạng thái hồ sơ và kết nối trực tiếp với ứng viên.
                    </p>
                </div>
            </div>

            {/* Combined Search & Filters panel - borderless, shadow-sm */}
            <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
                <form onSubmit={handleSearch} className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    <div className="lg:col-span-6 relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm ứng viên bằng tên, email..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 text-sm bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-[#0052CC]/25 transition-all duration-200"
                        />
                    </div>

                    <div className="lg:col-span-3 relative">
                        <select
                            value={filterJob}
                            onChange={(e) => setFilterJob(e.target.value)}
                            className="w-full h-12 pl-4 pr-10 text-sm bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-[#0052CC]/25 appearance-none cursor-pointer font-bold text-slate-700"
                            style={{
                                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 16px center',
                                backgroundSize: '16px'
                            }}
                        >
                            <option value="">Tất cả công việc</option>
                            {jobs.map((j) => (
                                <option key={j.id} value={j.id}>{j.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="lg:col-span-3">
                        <button
                            type="submit"
                            className="w-full h-12 bg-[#0052CC] hover:bg-[#0040a2] text-white text-sm font-bold rounded-2xl transition-all duration-200 cursor-pointer shadow-md active:scale-98"
                        >
                            Lọc & Tìm kiếm
                        </button>
                    </div>
                </form>

                {/* Filter Status Tabs & Categories selection */}
                <div className="pt-2 flex justify-end">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Ngành nghề:</span>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="text-xs bg-slate-50 rounded-xl px-3 py-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#0052CC]/20 cursor-pointer"
                        >
                            <option value="">Tất cả ngành nghề</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Content body - Borderless Cards, using theme color */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <div className="w-12 h-12 border-4 border-slate-150 border-t-[#0052CC] rounded-full animate-spin" />
                    <p className="text-xs text-slate-400 font-bold tracking-wide">Đang cập nhật hồ sơ ứng tuyển...</p>
                </div>
            ) : apps.length === 0 ? (
                <div className="bg-white rounded-3xl p-20 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-5">
                        <span className="material-symbols-outlined text-[36px] text-slate-400">group_off</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-700">Không tìm thấy ứng viên nào</h3>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2">
                        Hệ thống hiện tại chưa có đơn ứng tuyển nào khớp với bộ lọc tìm kiếm này.
                    </p>
                </div>
            ) : (
                <div className="flex flex-row overflow-x-auto gap-4 items-start select-none pb-4 scrollbar-thin w-full">
                    {[
                        { status: 'PENDING', label: 'Chờ xử lý', color: 'bg-amber-500/10 text-amber-800' },
                        { status: 'REVIEWING', label: 'Đang xem xét', color: 'bg-indigo-500/10 text-indigo-800' },
                        { status: 'ACCEPTED', label: 'Chấp nhận', color: 'bg-emerald-500/10 text-emerald-800' },
                        { status: 'REJECTED', label: 'Từ chối', color: 'bg-rose-500/10 text-rose-800' }
                    ].map(col => {
                        const colApps = apps.filter(app => app.status === col.status);
                        const visibleLimit = (visiblePages[col.status] || 1) * 8;
                        const slicedApps = colApps.slice(0, visibleLimit);
                        const isCollapsed = collapsedColumns.includes(col.status);

                        if (isCollapsed) {
                            return (
                                <div
                                    key={col.status}
                                    onClick={() => toggleColumnCollapse(col.status)}
                                    title={`Mở rộng cột ${col.label}`}
                                    className="bg-slate-50 hover:bg-slate-100/70 rounded-3xl p-3 flex flex-col items-center gap-4 transition-all duration-300 cursor-pointer w-[54px] min-w-[54px] h-[calc(100vh-240px)] flex-shrink-0"
                                >
                                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                                    <span className="text-xs font-bold text-slate-400 bg-white shadow-sm w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                                        {colApps.length}
                                    </span>
                                    <div 
                                        className="text-[10px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap mt-8"
                                        style={{ writingMode: 'vertical-lr' }}
                                    >
                                        {col.label}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={col.status}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, col.status)}
                                className="bg-slate-50 rounded-3xl p-4 h-[calc(100vh-240px)] flex flex-col gap-3 transition-all duration-300 flex-1 min-w-[282px]"
                            >
                                {/* Column Header */}
                                <div className="flex items-center justify-between px-1 py-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${col.color}`}>
                                            {col.label}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400 bg-white shadow-sm w-5 h-5 rounded-full flex items-center justify-center">
                                            {colApps.length}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => toggleColumnCollapse(col.status)}
                                        className="w-6 h-6 rounded-lg hover:bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                                        title="Thu gọn cột"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                                    </button>
                                </div>

                                {/* Cards list */}
                                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 scrollbar-thin">
                                    {colApps.length === 0 ? (
                                        <div className="py-12 text-center text-xs text-slate-400 italic">
                                            Kéo hồ sơ vào đây
                                        </div>
                                    ) : (
                                        slicedApps.map(app => (
                                            <div
                                                key={app.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, app.id)}
                                                onClick={() => setSelectedApp(app)}
                                                className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing space-y-3"
                                            >
                                                {/* Header info */}
                                                <div className="flex items-start gap-2.5">
                                                    <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(app.id)}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setSelectedIds(prev => 
                                                                    checked 
                                                                        ? [...prev, app.id] 
                                                                        : prev.filter(id => id !== app.id)
                                                                );
                                                            }}
                                                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC] cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0052CC] to-[#0040a2] flex items-center justify-center text-white text-[11px] font-black overflow-hidden flex-shrink-0">
                                                        {app.user.avatar ? (
                                                            <img src={app.user.avatar} alt={app.user.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            app.user.name[0]
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-xs font-extrabold text-slate-900 truncate hover:text-[#0052CC]">
                                                            {app.user.name}
                                                        </h4>
                                                        <p className="text-[9px] font-semibold text-slate-450 truncate">
                                                            {app.job.title}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Meta metrics */}
                                                <div className="flex flex-wrap gap-1.5 items-center">
                                                    {app.matchScore !== undefined && app.matchScore !== null && (
                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5 ${app.matchScore >= 75 ? 'bg-emerald-50 text-emerald-700' : app.matchScore >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                                                            <span className="material-symbols-outlined text-[11px]">neurology</span>
                                                            AI: {app.matchScore}%
                                                        </span>
                                                    )}
                                                    {app.quizScore !== undefined && app.quizScore !== null && (
                                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 flex items-center gap-0.5">
                                                            <span className="material-symbols-outlined text-[11px]">assignment</span>
                                                            {app.quizScore}%
                                                        </span>
                                                    )}
                                                </div>

                                                {/* View CV Quick button & Quick status action buttons */}
                                                <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400">
                                                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                        {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                                                    </span>

                                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                        {app.status === 'PENDING' && (
                                                            <button
                                                                type="button"
                                                                title="Đưa vào xem xét"
                                                                onClick={() => handleStatusChangeClick(app.id, 'REVIEWING')}
                                                                className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center justify-center cursor-pointer transition-all"
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                            </button>
                                                        )}
                                                        {(app.status === 'PENDING' || app.status === 'REVIEWING') && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    title="Chấp nhận"
                                                                    onClick={() => handleStatusChangeClick(app.id, 'ACCEPTED')}
                                                                    className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center cursor-pointer transition-all"
                                                                >
                                                                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    title="Từ chối"
                                                                    onClick={() => handleStatusChangeClick(app.id, 'REJECTED')}
                                                                    className="w-6 h-6 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center justify-center cursor-pointer transition-all"
                                                                >
                                                                    <span className="material-symbols-outlined text-[14px]">cancel</span>
                                                                </button>
                                                            </>
                                                        )}
                                                        {(app.status === 'ACCEPTED' || app.status === 'REJECTED') && (
                                                            <button
                                                                type="button"
                                                                title="Quay lại chờ xử lý"
                                                                onClick={() => handleStatusChangeClick(app.id, 'PENDING')}
                                                                className="w-6 h-6 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-all"
                                                            >
                                                                <span className="material-symbols-outlined text-[14px]">replay</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Column pagination Load More button */}
                                {colApps.length > slicedApps.length && (
                                    <button
                                        type="button"
                                        onClick={() => setVisiblePages(prev => ({ ...prev, [col.status]: (prev[col.status] || 1) + 1 }))}
                                        className="w-full py-2 text-center text-xs font-bold text-[#0052CC] hover:text-[#0040a2] bg-white rounded-xl shadow-sm hover:shadow transition-all cursor-pointer mt-1 flex-shrink-0"
                                    >
                                        Xem thêm ({colApps.length - slicedApps.length}) ứng viên
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedApp && (
                <CandidateDetailsModal
                    app={selectedApp}
                    onClose={() => setSelectedApp(null)}
                    onBookmark={() => handleBookmark(selectedApp.id)}
                    isBookmarked={apps.find(a => a.id === selectedApp.id)?.isBookmarked ?? selectedApp.isBookmarked}
                    onEvaluate={(score) => {
                        setApps(prev =>
                            prev.map(app =>
                                app.id === selectedApp.id ? { ...app, matchScore: score } : app
                            )
                        );
                        setSelectedApp(prev => prev ? { ...prev, matchScore: score } : null);
                    }}
                />
            )}

            {emailModal && (
                <EmailTemplateModal
                    isOpen={!!emailModal}
                    onClose={() => setEmailModal(null)}
                    candidateName={emailModal.candidateName}
                    jobTitle={emailModal.jobTitle}
                    companyName={emailModal.companyName}
                    status={emailModal.status}
                    onSubmit={handleSendEmailAndChangeStatus}
                    isSending={sendingEmail}
                />
            )}

            {/* Bulk status update bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white px-6 py-4 rounded-3xl shadow-xl border border-slate-100 flex items-center gap-6 z-50 animate-slideUp">
                    <span className="text-xs font-extrabold text-slate-800">
                        Đã chọn <span className="text-[#0052CC] text-sm">{selectedIds.length}</span> ứng viên
                    </span>
                    
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleBulkStatusUpdateClick('REVIEWING')}
                            disabled={updatingId === 'bulk'}
                            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl cursor-pointer transition-all disabled:opacity-50"
                        >
                            Xem xét
                        </button>
                        <button
                            type="button"
                            onClick={() => handleBulkStatusUpdateClick('ACCEPTED')}
                            disabled={updatingId === 'bulk'}
                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl cursor-pointer transition-all disabled:opacity-50"
                        >
                            Chấp nhận
                        </button>
                        <button
                            type="button"
                            onClick={() => handleBulkStatusUpdateClick('REJECTED')}
                            disabled={updatingId === 'bulk'}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl cursor-pointer transition-all disabled:opacity-50"
                        >
                            Từ chối
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-1" />
                        <button
                            type="button"
                            onClick={() => setSelectedIds([])}
                            className="text-xs font-bold text-slate-400 hover:text-slate-650 cursor-pointer"
                        >
                            Bỏ chọn
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk status update modal */}
            {bulkModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-black text-slate-800">
                                Cập nhật hàng loạt: {bulkModal.status === 'ACCEPTED' ? 'Chấp nhận' : 'Từ chối'} ({selectedIds.length} ứng viên)
                            </h3>
                            <button
                                type="button"
                                onClick={() => setBulkModal(null)}
                                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <p className="text-xs text-slate-505 leading-normal">
                            Bạn đang chuẩn bị thay đổi trạng thái của <strong className="text-slate-700">{selectedIds.length} ứng viên</strong> sang <strong className="text-[#0052CC]">{bulkModal.status === 'ACCEPTED' ? 'Chấp nhận hồ sơ' : 'Từ chối hồ sơ'}</strong>. Hệ thống sẽ gửi email tự động cho từng ứng viên theo mẫu dưới đây:
                        </p>

                        <div className="bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200 text-[10px] font-semibold text-slate-550 space-y-1">
                            <p className="text-slate-600 font-bold">💡 Mẹo sử dụng thẻ động:</p>
                            <p>Sử dụng <code className="bg-white px-1 py-0.5 rounded border text-slate-700 font-bold">{`{ten_ung_vien}`}</code> để tự động chèn tên ứng viên.</p>
                            <p>Sử dụng <code className="bg-white px-1 py-0.5 rounded border text-slate-700 font-bold">{`{ten_cong_viec}`}</code> để chèn tên công việc.</p>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400">Tiêu đề Email</label>
                                <input
                                    type="text"
                                    id="bulk-email-subject"
                                    defaultValue={bulkModal.status === 'ACCEPTED' ? 'Thư mời nhận việc và ký kết hợp đồng thử việc' : 'Thư cảm ơn ứng tuyển'}
                                    className="w-full h-11 px-4 text-xs bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-[#0052CC]/25 transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400">Nội dung Email</label>
                                <textarea
                                    id="bulk-email-body"
                                    rows={6}
                                    defaultValue={
                                        bulkModal.status === 'ACCEPTED'
                                            ? `Xin chào {ten_ung_vien},\n\nChúc mừng bạn đã xuất sắc vượt qua các vòng đánh giá cho vị trí {ten_cong_viec} tại công ty chúng tôi.\n\nChúng tôi trân trọng kính mời bạn tham gia buổi trao đổi chi tiết về công việc và chế độ đãi ngộ.\n\nTrân trọng,\nBộ phận Tuyển dụng.`
                                            : `Xin chào {ten_ung_vien},\n\nCảm ơn bạn đã quan tâm và nộp hồ sơ ứng tuyển vị trí {ten_cong_viec}.\n\nHồ sơ của bạn rất ấn tượng, tuy nhiên ở thời điểm hiện tại, chúng tôi đang ưu tiên các ứng viên có định hướng phù hợp hơn. Rất hy vọng có cơ hội hợp tác cùng bạn trong tương lai.\n\nTrân trọng,\nBộ phận Tuyển dụng.`
                                    }
                                    className="w-full p-4 text-xs bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-[#0052CC]/25 transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setBulkModal(null)}
                                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                disabled={updatingId === 'bulk'}
                                onClick={() => {
                                    const subject = (document.getElementById('bulk-email-subject') as HTMLInputElement)?.value || '';
                                    const body = (document.getElementById('bulk-email-body') as HTMLTextAreaElement)?.value || '';
                                    executeBulkStatusUpdate(bulkModal.status, subject, body);
                                }}
                                className="px-5 py-2.5 bg-[#0052CC] hover:bg-[#0040a2] text-white text-xs font-bold rounded-xl cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {updatingId === 'bulk' && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                Xác nhận & Gửi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── ApplicationStatusActions ──────────────────────────────────
function ApplicationStatusActions({
    appId,
    status,
    conversationId,
    updating,
    actions,
    onUpdate,
    onGoToChat,
    onOpenChat,
}: {
    appId: string;
    status: string;
    conversationId?: string | null;
    updating: boolean;
    actions: string[];
    onUpdate: (status: string) => void;
    onGoToChat: (convId: string) => void;
    onOpenChat: () => void;
}) {
    const statusStyle: Record<string, string> = {
        PENDING: 'bg-amber-50/70 text-amber-800',
        REVIEWING: 'bg-indigo-50/70 text-indigo-800',
        ACCEPTED: 'bg-emerald-50/70 text-emerald-800',
        REJECTED: 'bg-rose-50/70 text-rose-800',
    };

    const actionBtnStyle: Record<string, string> = {
        REVIEWING: 'bg-slate-50 hover:bg-slate-100 text-indigo-700',
        ACCEPTED: 'bg-[#0052CC] hover:bg-[#0040a2] text-white',
        REJECTED: 'bg-slate-50 hover:bg-slate-100 text-rose-700',
        PENDING: 'bg-slate-50 hover:bg-slate-100 text-amber-700',
    };
    const actionLabel: Record<string, string> = {
        REVIEWING: 'Đưa vào xem xét',
        ACCEPTED: 'Chấp nhận hồ sơ',
        REJECTED: 'Từ chối hồ sơ',
        PENDING: 'Đưa lại về chờ',
    };

    return (
        <div className="pt-5 space-y-4">
            {/* Status notification banner - Borderless */}
            <div className={`rounded-2xl px-5 py-4 flex items-start gap-3 ${statusStyle[status] ?? 'bg-slate-50 text-slate-700'}`}>
                <span className="material-symbols-outlined text-[20px] mt-0.5">
                    {status === 'ACCEPTED' ? 'check_circle' : status === 'REJECTED' ? 'cancel' : 'info'}
                </span>
                <div>
                    <h5 className="text-sm font-bold">Trạng thái hồ sơ: {getApplicationStatusLabel(status)}</h5>
                    <p className="text-xs opacity-85 leading-normal mt-0.5">
                        {status === 'ACCEPTED' && 'Ứng viên đã được chấp nhận. Bạn có thể đặt lịch phỏng vấn và mở kênh trò chuyện với ứng viên ngay bây giờ.'}
                        {status === 'REJECTED' && 'Hồ sơ của ứng viên không phù hợp cho vị trí này ở thời điểm hiện tại.'}
                        {status === 'PENDING' && 'Đơn ứng tuyển đang trong trạng thái chờ duyệt. Vui lòng xem thông tin chi tiết và cập nhật trạng thái phù hợp.'}
                        {status === 'REVIEWING' && 'Ứng viên đang được xem xét đánh giá kỹ hơn bởi bộ phận tuyển dụng.'}
                    </p>
                </div>
            </div>

            {/* Chat connection bar - Borderless */}
            {status === 'ACCEPTED' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-indigo-50/40 rounded-2xl shadow-inner">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-[22px] text-[#0052CC] mt-0.5">chat_bubble</span>
                        <div>
                            <p className="text-sm font-extrabold text-indigo-950">Mở kênh kết nối trực tuyến</p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                                {conversationId
                                    ? 'Đã có kênh chat chính thức giữa bạn và ứng viên. Nhấp vào nút bên cạnh để vào chat.'
                                    : 'Thiết lập cuộc trò chuyện chat trực tiếp để thỏa thuận thêm về công việc và lịch gặp mặt.'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation();
                            if (conversationId) {
                                onGoToChat(conversationId);
                            } else {
                                onOpenChat();
                            }
                        }}
                        disabled={updating}
                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#0052CC] hover:bg-[#0040a2] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow"
                    >
                        <span className="material-symbols-outlined text-[16px]">
                            {conversationId ? 'open_in_new' : 'forum'}
                        </span>
                        {updating ? 'Đang kết nối...' : conversationId ? 'Mở kênh chat' : 'Bắt đầu chat'}
                    </button>
                </div>
            )}

            {/* Action buttons list */}
            {actions.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Cập nhật trạng thái xử lý đơn:</p>
                    <div className="flex flex-wrap gap-2.5">
                        {actions.map(st => (
                            <button
                                key={st}
                                type="button"
                                disabled={updating}
                                onClick={e => { e.stopPropagation(); onUpdate(st); }}
                                className={`flex items-center gap-1.5 px-4 h-10 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 transition-all ${actionBtnStyle[st] ?? 'bg-slate-50 hover:bg-slate-100 text-slate-655'}`}
                            >
                                {updating ? (
                                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[15px]">
                                            {st === 'ACCEPTED' ? 'check_circle' : st === 'REJECTED' ? 'cancel' : 'replay'}
                                        </span>
                                        {actionLabel[st] ?? st}
                                    </>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── ResumeSummaryBlock ────────────────────────────────────────
function ResumeSummaryBlock({ education, experience }: { education: unknown; experience: unknown }) {
    const edu = parseResumeJson<EducationItem>(education);
    const exp = parseResumeJson<ExperienceItem>(experience);
    if (edu.length === 0 && exp.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/50 p-4 rounded-xl leading-relaxed">
            {edu.length > 0 && (
                <div className="space-y-2">
                    <h5 className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">school</span> Lịch sử học vấn
                    </h5>
                    <div className="space-y-1.5">
                        {edu.slice(0, 3).map((e, i) => (
                            <div key={i} className="text-slate-700">
                                <strong>{e.school}</strong>
                                {e.degree && <span className="text-slate-550 block text-[11px] font-semibold mt-0.5">{e.degree}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {exp.length > 0 && (
                <div className="space-y-2">
                    <h5 className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">work</span> Kinh nghiệm làm việc
                    </h5>
                    <div className="space-y-1.5">
                        {exp.slice(0, 3).map((e, i) => (
                            <div key={i} className="text-slate-700">
                                <strong>{e.company}</strong>
                                {e.position && <span className="text-slate-550 block text-[11px] font-semibold mt-0.5">{e.position}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}