'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Job {
    id: string;
    title: string;
    description: string;
    benefits?: string;
    requirements?: string;
    quantity: number;
    salaryMin?: number;
    salaryMax?: number;
    addressDetail?: string;
    type: string;
    experience?: string;
    level?: string;
    status: string;
    deadline?: string;
    isVisible: boolean;
    createdAt: string;
    updatedAt: string;
    company: { id: string; name: string };
    category: { id: string; name: string };
}

type ToastType = 'success' | 'error';
interface Toast { message: string; type: ToastType; }

export default function JobDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<Toast | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchJob();
    }, [id]);

    const fetchJob = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/jobs/${id}`);
            if (!res.ok) throw new Error('Failed to fetch job detail');
            const data = await res.json();
            if (!data.job) throw new Error('Job not found');
            setJob(data.job);
        } catch (err) {
            console.error(err);
            showToast('Không thể tải thông tin tin tuyển dụng', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleToggleVisibility = async () => {
        if (!job) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/jobs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isVisible: !job.isVisible }),
            });
            if (!res.ok) throw new Error();
            setJob(prev => prev ? { ...prev, isVisible: !prev.isVisible } : null);
            showToast(job.isVisible ? 'Đã ẩn tin tuyển dụng thành công' : 'Đã hiện tin tuyển dụng thành công', 'success');
        } catch {
            showToast('Có lỗi xảy ra, vui lòng thử lại.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!job) return;
        setActionLoading(true);
        setShowDeleteModal(false);
        try {
            const res = await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            showToast('Đã xóa tin tuyển dụng thành công', 'success');
            setTimeout(() => router.push('/admin/jobs'), 1500);
        } catch {
            showToast('Xóa thất bại, vui lòng thử lại.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!job) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/jobs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error();
            setJob(prev => prev ? { ...prev, status: newStatus } : null);
            showToast(`Đã ${newStatus === 'ACTIVE' ? 'duyệt' : 'từ chối'} tin tuyển dụng thành công`, 'success');
        } catch {
            showToast('Cập nhật trạng thái thất bại.', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatSalary = (min?: number, max?: number) => {
        if (min == null && max == null) return 'Thỏa thuận';
        if (min != null && max != null) return `${min} - ${max} triệu`;
        if (min != null) return `Từ ${min} triệu`;
        return `Lên đến ${max} triệu`;
    };

    const statusConfig: Record<string, { label: string; className: string }> = {
        ACTIVE: { label: 'Đang tuyển', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
        CLOSED: { label: 'Đã đóng', className: 'bg-gray-500/15  text-gray-400  border-gray-500/30' },
        PENDING: { label: 'Chờ duyệt', className: 'bg-amber-500/15  text-amber-400  border-amber-500/30' },
        REJECTED: { label: 'Từ chối', className: 'bg-red-500/15    text-red-400    border-red-500/30' },
    };

    const typeConfig: Record<string, string> = {
        FULL_TIME: 'Toàn thời gian',
        PART_TIME: 'Bán thời gian',
        CONTRACT: 'Hợp đồng',
        INTERNSHIP: 'Thực tập',
        REMOTE: 'Làm từ xa',
        FREELANCE: 'Tự do',
    };

    const experienceConfig: Record<string, string> = {
        NO_EXPERIENCE: 'Không yêu cầu kinh nghiệm',
        UNDER_1_YEAR: 'Dưới 1 năm',
        ONE_TO_THREE_YEARS: '1 - 3 năm',
        THREE_TO_FIVE_YEARS: '3 - 5 năm',
        OVER_FIVE_YEARS: 'Trên 5 năm',
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                <div className="w-10 h-10 border-[3px] border-white/10 border-t-indigo-500 rounded-full animate-spin mb-4" />
                <span>Đang tải thông tin tin tuyển dụng...</span>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400 mb-6">Không tìm thấy tin tuyển dụng hoặc có lỗi xảy ra.</p>
                <Link href="/admin/jobs" className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/8 text-white rounded-xl text-sm font-medium transition-colors">
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    const cfg = statusConfig[job.status] ?? { label: job.status, className: 'bg-gray-500/15 text-gray-400 border-gray-500/30' };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-white/50">
                    <Link href="/admin/jobs" className="hover:text-white transition-colors">Tin tuyển dụng</Link>
                    <span>/</span>
                    <span className="text-white/80 truncate max-w-[200px]">{job.title}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => router.push('/admin/jobs')}
                        className="px-4 py-2 bg-white/5 hover:bg-white/8 border border-white/10 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        Quay lại danh sách
                    </button>
                    
                    {/* Toggle visibility */}
                    <button
                        onClick={handleToggleVisibility}
                        disabled={actionLoading}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors flex items-center gap-1.5 ${
                            job.isVisible 
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20' 
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                        }`}
                    >
                        {job.isVisible ? '🙈 Ẩn tin' : '👁 Hiển thị tin'}
                    </button>

                    {/* Edit */}
                    <button
                        onClick={() => router.push(`/admin/jobs/${job.id}/edit`)}
                        className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
                    >
                        ✏️ Sửa đổi
                    </button>

                    {/* Approve (Only for PENDING status) */}
                    {job.status === 'PENDING' && (
                        <button
                            onClick={() => handleStatusChange('ACTIVE')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
                        >
                            ✓ Duyệt tin tuyển dụng
                        </button>
                    )}

                    {/* Reject (Only for PENDING status) */}
                    {job.status === 'PENDING' && (
                        <button
                            onClick={() => handleStatusChange('REJECTED')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
                        >
                            ✕ Từ chối duyệt
                        </button>
                    )}

                    {/* Delete */}
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
                    >
                        🗑️ Xóa tin
                    </button>
                </div>
            </div>

            {/* Main Details Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: General details, description & requirements */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Header Summary */}
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                                <h1 className="text-xl md:text-2xl font-bold text-white leading-snug">{job.title}</h1>
                                <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
                                    <span>🏢</span>
                                    <span className="text-sm">{job.company?.name || 'Chưa cập nhật'}</span>
                                </div>
                            </div>
                            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${cfg.className}`}>
                                {cfg.label}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/5 text-xs text-white/40">
                            <div>Ngày tạo: <span className="text-white/60">{formatDate(job.createdAt)}</span></div>
                            <div>Cập nhật gần nhất: <span className="text-white/60">{formatDate(job.updatedAt)}</span></div>
                            <div className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${job.isVisible ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                                <span className="text-white/60">{job.isVisible ? 'Đang hiển thị với người dùng' : 'Đang ẩn'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Job Details Card */}
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-6">
                        <h2 className="text-base font-bold text-white border-l-4 border-indigo-500 pl-3">Thông tin chi tiết tuyển dụng</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">💰</span>
                                <div>
                                    <div className="text-white/40 text-xs">Mức lương</div>
                                    <div className="font-semibold text-white mt-0.5">{formatSalary(job.salaryMin, job.salaryMax)}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <span className="text-xl">⏳</span>
                                <div>
                                    <div className="text-white/40 text-xs">Hình thức làm việc</div>
                                    <div className="font-semibold text-white mt-0.5">{typeConfig[job.type] || job.type}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <span className="text-xl">🎓</span>
                                <div>
                                    <div className="text-white/40 text-xs font-medium">Cấp bậc</div>
                                    <div className="font-semibold text-white mt-0.5">{job.level || '—'}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <span className="text-xl">🛠</span>
                                <div>
                                    <div className="text-white/40 text-xs">Kinh nghiệm</div>
                                    <div className="font-semibold text-white mt-0.5">{experienceConfig[job.experience || ''] || 'Không yêu cầu kinh nghiệm'}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <span className="text-xl">📂</span>
                                <div>
                                    <div className="text-white/40 text-xs">Danh mục / Ngành nghề</div>
                                    <div className="font-semibold text-white mt-0.5">{job.category?.name || '—'}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <span className="text-xl">👥</span>
                                <div>
                                    <div className="text-white/40 text-xs">Số lượng tuyển dụng</div>
                                    <div className="font-semibold text-white mt-0.5">{job.quantity} người</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 md:col-span-2">
                                <span className="text-xl">📍</span>
                                <div>
                                    <div className="text-white/40 text-xs">Địa điểm làm việc</div>
                                    <div className="font-semibold text-white mt-0.5">
                                        {job.addressDetail ? `${job.addressDetail}, ` : ''}
                                        {job.company ? 'Phú Quốc' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rich text descriptions */}
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-base font-bold text-white border-l-4 border-indigo-500 pl-3">Mô tả công việc</h3>
                            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                        </div>

                        {job.requirements && (
                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <h3 className="text-base font-bold text-white border-l-4 border-indigo-500 pl-3">Yêu cầu ứng viên</h3>
                                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
                            </div>
                        )}

                        {job.benefits && (
                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <h3 className="text-base font-bold text-white border-l-4 border-indigo-500 pl-3">Quyền lợi ứng viên</h3>
                                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{job.benefits}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Quick info, metadata & company info */}
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-white/40">Thông tin hạn nộp</h3>
                        <div className="text-center py-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="text-xs text-white/50">Hạn nhận hồ sơ đến</div>
                            <div className="text-lg font-bold text-white mt-1">{formatDate(job.deadline)}</div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                        <h3 className="text-sm font-bold text-white border-l-4 border-indigo-500 pl-3">Nhà tuyển dụng</h3>
                        <div className="space-y-3 pt-2">
                            <div className="font-semibold text-white">{job.company?.name}</div>
                            <div className="text-xs text-white/40 leading-relaxed">
                                Để chỉnh sửa thông tin hoặc quản trị doanh nghiệp này, vui lòng truy cập mục quản lý doanh nghiệp tương ứng.
                            </div>
                            <button
                                onClick={() => router.push(`/admin/companies`)}
                                className="w-full py-2 bg-white/5 hover:bg-white/8 border border-white/10 text-white rounded-xl text-xs font-semibold transition-colors"
                            >
                                Xem thông tin doanh nghiệp
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="rounded-2xl p-8 w-[360px] max-w-[92vw] shadow-2xl border border-white/10 bg-[#0f1420]" onClick={e => e.stopPropagation()}>
                        <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-2xl mx-auto mb-4">🗑️</div>
                        <h2 className="text-lg font-bold text-white text-center mb-2">Xóa tin tuyển dụng?</h2>
                        <p className="text-sm text-gray-400 text-center leading-relaxed mb-6">
                            Bạn có chắc muốn xóa tin{' '}
                            <span className="font-semibold text-white">"{job.title}"</span>?{' '}
                            Hành động này <span className="font-semibold text-red-400">không thể hoàn tác</span>.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)}
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
            )}

            {/* Toast Alert */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl text-white border ${
                    toast.type === 'success' ? 'bg-emerald-600/90 border-emerald-500/50' : 'bg-red-600/90 border-red-500/50'
                }`}>
                    {toast.type === 'success' ? '✓' : '✕'} {toast.message}
                </div>
            )}
        </div>
    );
}
