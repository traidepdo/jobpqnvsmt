'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';



interface Job {
    id: string;
    title: string;
    salary?: string;
    location?: string;
    isVisible: boolean;
    status: string;
    createdAt: string;
    company: { id: string; name: string };
    category: { id: string; name: string };
}
interface JobDetail extends Job {
    experience?: string;
    description?: string;
    requirements?: string;
    benefits?: string;
    deadline?: string;
}

type ToastType = 'success' | 'error';
interface Toast { message: string; type: ToastType; }
interface DeleteModal { open: boolean; jobId: string | null; jobTitle: string; }
interface VisibilityModal { open: boolean; jobId: string | null; jobTitle: string; isVisible: boolean; }

export default function JobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<Toast | null>(null);
    const [deleteModal, setDeleteModal] = useState<DeleteModal>({ open: false, jobId: null, jobTitle: '' });
    const [visibilityModal, setVisibilityModal] = useState<VisibilityModal>({ open: false, jobId: null, jobTitle: '', isVisible: true });
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [detailJob, setDetailJob] = useState<JobDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const openJobDetail = async (jobId: string) => {
        setDetailLoading(true);
        setDetailJob(jobs.find(j => j.id === jobId) as JobDetail ?? null); // hiện data cũ trước
        try {
            const res = await fetch(`/api/admin/jobs/${jobId}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setDetailJob(data.job ?? data);
        } catch { /* giữ data cũ */ }
        finally { setDetailLoading(false); }
    };
    useEffect(() => { fetchJobs(); }, [page, limit, search]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit), search });
            const res = await fetch(`/api/admin/jobs?${params}`);
            if (!res.ok) throw new Error('Failed to fetch jobs');
            const data = await res.json();
            if (!data.jobs) throw new Error(data.message || 'Unknown error');
            setJobs(data.jobs);
            setPagination(data.pagination);
        } catch (err) {
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Search
    const handleSearch = () => { setPage(1); setSearch(searchInput); };
    const handleClearSearch = () => { setSearchInput(''); setSearch(''); setPage(1); };
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

    // Delete
    const openDelete = (job: Job) => setDeleteModal({ open: true, jobId: job.id, jobTitle: job.title });
    const closeDelete = () => setDeleteModal({ open: false, jobId: null, jobTitle: '' });
    const handleDelete = async () => {
        const { jobId, jobTitle } = deleteModal;
        if (!jobId) return;
        setActionLoading(jobId);
        closeDelete();
        try {
            const res = await fetch(`/api/admin/jobs/${jobId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            setJobs(prev => prev.filter(j => j.id !== jobId));
            showToast(`Đã xóa tin tuyển dụng "${jobTitle}"`, 'success');
        } catch { showToast('Xóa thất bại, vui lòng thử lại.', 'error'); }
        finally { setActionLoading(null); }
    };

    // Visibility toggle
    const openVisibility = (job: Job) => setVisibilityModal({ open: true, jobId: job.id, jobTitle: job.title, isVisible: job.isVisible });
    const closeVisibility = () => setVisibilityModal({ open: false, jobId: null, jobTitle: '', isVisible: true });
    const handleToggleVisibility = async () => {
        const { jobId, isVisible, jobTitle } = visibilityModal;
        if (!jobId) return;
        setActionLoading(jobId);
        closeVisibility();
        try {
            const res = await fetch(`/api/admin/jobs/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isVisible: !isVisible }),
            });
            if (!res.ok) throw new Error();
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, isVisible: !isVisible } : j));
            showToast(isVisible ? `Đã ẩn tin "${jobTitle}"` : `Đã hiện tin "${jobTitle}"`, 'success');
        } catch { showToast('Có lỗi xảy ra, vui lòng thử lại.', 'error'); }
    };

    // Approve/Reject Status
    const handleStatusChange = async (jobId: string, newStatus: string, jobTitle: string) => {
        setActionLoading(jobId);
        try {
            const res = await fetch(`/api/admin/jobs/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error();
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
            showToast(`Đã ${newStatus === 'ACTIVE' ? 'duyệt' : 'từ chối'} tin tuyển dụng "${jobTitle}"`, 'success');
        } catch {
            showToast('Cập nhật trạng thái thất bại.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const statusConfig: Record<string, { label: string; className: string }> = {
        ACTIVE: { label: 'Đang tuyển', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
        CLOSED: { label: 'Đã đóng', className: 'bg-gray-500/15  text-gray-400  border-gray-500/30' },
        PENDING: { label: 'Chờ duyệt', className: 'bg-amber-500/15  text-amber-400  border-amber-500/30' },
        REJECTED: { label: 'Từ chối', className: 'bg-red-500/15    text-red-400    border-red-500/30' },
    };

    const startIndex = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
    const endIndex = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

    return (








        <div className="min-h-screen p-8" style={{ background: 'linear-gradient(135deg, #060810 0%, #0d1117 100%)' }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white">Quản lý tin tuyển dụng</h1>
                    {!loading && pagination && (
                        <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold px-3 py-1 rounded-full">
                            {pagination.total} tin
                        </span>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-3 mb-5">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm kiếm tiêu đề hoặc mô tả..."
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full pl-9 pr-9 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white/8 transition-colors"
                    />
                    {searchInput && (
                        <button onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-lg leading-none">×</button>
                    )}
                </div>
                <button onClick={handleSearch}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
                    Tìm kiếm
                </button>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {loading ? (
                    <div className="text-center py-16 text-gray-500">Đang tải dữ liệu...</div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">Không có tin tuyển dụng nào.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    {['Tiêu đề & Công ty', 'Danh mục', 'Lương', 'Địa điểm', 'Trạng thái', 'Hiển thị', 'Ngày tạo', 'Thao tác'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map((job, idx) => (
                                    <tr key={job.id}
                                        onClick={() => openJobDetail(job.id)}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                        style={idx % 2 !== 0 ? { background: 'rgba(255,255,255,0.015)' } : {}}>

                                        {/* Title + Company */}
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-white max-w-[220px] truncate">{job.title}</div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <span className="text-xs text-indigo-400">🏢</span>
                                                <span
                                                    className="text-xs text-gray-400 hover:text-indigo-400 truncate max-w-[180px] cursor-pointer transition-colors"
                                                    onClick={() => {
                                                        router.push(`/admin/companies?search=${job.company?.name}`);
                                                    }}
                                                >
                                                    {job.company?.name || '—'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Category */}
                                        < td className="px-4 py-3" >
                                            <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                                {job.category?.name || '—'}
                                            </span>
                                        </td>

                                        {/* Salary */}
                                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                                            {job.salary || <span className="text-gray-600">—</span>}
                                        </td>

                                        {/* Location */}
                                        <td className="px-4 py-3 text-gray-400 max-w-[140px] truncate whitespace-nowrap">
                                            {job.location || <span className="text-gray-600">—</span>}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            {(() => {
                                                const cfg = statusConfig[job.status] ?? { label: job.status, className: 'bg-gray-500/15 text-gray-400 border-gray-500/30' };
                                                return (
                                                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.className}`}>
                                                        {cfg.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>

                                        {/* Visibility */}
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${job.isVisible ? 'text-emerald-400' : 'text-gray-500'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${job.isVisible ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                                                {job.isVisible ? 'Hiển thị' : 'Đã ẩn'}
                                            </span>
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(job.createdAt)}</td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                {/* View */}
                                                <button
                                                    onClick={() => router.push(`/admin/jobs/${job.id}`)}
                                                    title="Xem chi tiết"
                                                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors"
                                                >
                                                    Xem chi tiết
                                                </button>

                                                {/* Edit */}
                                                <button
                                                    onClick={() => router.push(`/admin/jobs/${job.id}/edit`)}
                                                    title="Chỉnh sửa"
                                                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
                                                >
                                                    Sửa tin
                                                </button>

                                                {/* Approve (Only for PENDING status) */}
                                                {job.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleStatusChange(job.id, 'ACTIVE', job.title)}
                                                        disabled={actionLoading === job.id}
                                                        title="Phê duyệt tin"
                                                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        ✓ Duyệt
                                                    </button>
                                                )}

                                                {/* Reject (Only for PENDING status) */}
                                                {job.status === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleStatusChange(job.id, 'REJECTED', job.title)}
                                                        disabled={actionLoading === job.id}
                                                        title="Từ chối tin"
                                                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        ✕ Từ chối
                                                    </button>
                                                )}

                                                {/* Toggle visibility */}
                                                <button
                                                    onClick={() => openVisibility(job)}
                                                    disabled={actionLoading === job.id}
                                                    title={job.isVisible ? 'Ẩn tin' : 'Hiện tin'}
                                                    className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${job.isVisible
                                                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                                                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                                        }`}
                                                >
                                                    {actionLoading === job.id ? (
                                                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                        </svg>
                                                    ) : job.isVisible ? '🙈' : 'Hiện'}
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => openDelete(job)}
                                                    disabled={actionLoading === job.id}
                                                    title="Xóa"
                                                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
                }
            </div >

            {/* Pagination */}
            {
                pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-5 text-sm text-gray-500">
                        <span>Hiển thị {startIndex}–{endIndex} / {pagination.total} tin</span>
                        <div className="flex gap-1">
                            {[{ label: '«', action: () => setPage(1) }, { label: '‹', action: () => setPage(p => Math.max(1, p - 1)) }].map(btn => (
                                <button key={btn.label} onClick={btn.action} disabled={page === 1}
                                    className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg disabled:opacity-30 hover:bg-white/10 transition-colors text-gray-300">
                                    {btn.label}
                                </button>
                            ))}

                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) =>
                                    p === '...' ? (
                                        <span key={`dots-${i}`} className="px-2 py-1 text-gray-600">…</span>
                                    ) : (
                                        <button key={p} onClick={() => setPage(p as number)}
                                            className={`px-3 py-1 border rounded-lg transition-colors ${p === page
                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}>
                                            {p}
                                        </button>
                                    )
                                )}

                            {[{ label: '›', action: () => setPage(p => Math.min(pagination.totalPages, p + 1)) }, { label: '»', action: () => setPage(pagination.totalPages) }].map(btn => (
                                <button key={btn.label} onClick={btn.action} disabled={page === pagination.totalPages}
                                    className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg disabled:opacity-30 hover:bg-white/10 transition-colors text-gray-300">
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Visibility Modal */}
            {
                visibilityModal.open && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={closeVisibility}>
                        <div className="rounded-2xl p-8 w-[360px] max-w-[92vw] shadow-2xl border border-white/10"
                            style={{ background: '#0f1420' }} onClick={e => e.stopPropagation()}>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 ${visibilityModal.isVisible ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                                {visibilityModal.isVisible ? '🙈' : '👁'}
                            </div>
                            <h2 className="text-lg font-bold text-white text-center mb-2">
                                {visibilityModal.isVisible ? 'Ẩn tin tuyển dụng?' : 'Hiện tin tuyển dụng?'}
                            </h2>
                            <p className="text-sm text-gray-400 text-center leading-relaxed mb-6">
                                {visibilityModal.isVisible
                                    ? <>Ẩn tin <span className="font-semibold text-white">"{visibilityModal.jobTitle}"</span>? Tin sẽ không hiển thị với người tìm việc.</>
                                    : <>Hiện tin <span className="font-semibold text-white">"{visibilityModal.jobTitle}"</span>? Tin sẽ hiển thị trở lại với người tìm việc.</>
                                }
                            </p>
                            <div className="flex gap-3">
                                <button onClick={closeVisibility}
                                    className="flex-1 py-2.5 rounded-xl bg-white/8 border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/12 transition-colors">
                                    Hủy
                                </button>
                                <button onClick={handleToggleVisibility}
                                    className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors ${visibilityModal.isVisible ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                                    {visibilityModal.isVisible ? 'Ẩn tin' : 'Hiện tin'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Modal */}
            {
                deleteModal.open && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={closeDelete}>
                        <div className="rounded-2xl p-8 w-[360px] max-w-[92vw] shadow-2xl border border-white/10"
                            style={{ background: '#0f1420' }} onClick={e => e.stopPropagation()}>
                            <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-2xl mx-auto mb-4">🗑️</div>
                            <h2 className="text-lg font-bold text-white text-center mb-2">Xóa tin tuyển dụng?</h2>
                            <p className="text-sm text-gray-400 text-center leading-relaxed mb-6">
                                Bạn có chắc muốn xóa tin{' '}
                                <span className="font-semibold text-white">"{deleteModal.jobTitle}"</span>?{' '}
                                Hành động này <span className="font-semibold text-red-400">không thể hoàn tác</span>.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={closeDelete}
                                    className="flex-1 py-2.5 rounded-xl bg-white/8 border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/12 transition-colors">
                                    Hủy
                                </button>
                                <button onClick={handleDelete}
                                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors">
                                    Xóa tin
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Toast */}
            {
                toast && (
                    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl text-white border ${toast.type === 'success' ? 'bg-emerald-600/90 border-emerald-500/50' : 'bg-red-600/90 border-red-500/50'
                        }`}>
                        {toast.type === 'success' ? '✓' : '✕'} {toast.message}
                    </div>
                )
            }
        </div >
    );
}