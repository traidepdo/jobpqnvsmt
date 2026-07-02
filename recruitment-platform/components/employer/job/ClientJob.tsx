'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDateVi, formatSalary, getJobStatusLabel, TABS } from '@/lib/jobLabels';
import { Job, Pagination } from "@/lib/types/employer/job";

export default function EmployerJobsPage({ jobsData, paginationData, categories }: { jobsData?: Job[]; paginationData: Pagination | null, categories?: { id: string, name: string, slug: string }[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const currentStatus = searchParams.get('status') || undefined;
    const currentIsVisible = searchParams.get('isVisible') || undefined;
    const [jobs, setJobs] = useState<Job[]>(jobsData || []);
    const [pagination, setPagination] = useState<Pagination | null>(paginationData);
    const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
    const [categoryValue, setCategoryValue] = useState(searchParams.get('category') || '');
    const [categoryList, setCategoryList] = useState<{ id: string, name: string, slug: string }[]>(categories || []);

    useEffect(() => {
        setJobs(jobsData || []);
        setPagination(paginationData);
        setLoading(false);
        setCategoryList(categories || []);
    }, [jobsData, paginationData, categories]);

    const activeTab = TABS.findIndex(t => {
        return t.status === currentStatus && t.isVisible === currentIsVisible;
    });
    const safeActiveTab = activeTab === -1 ? 0 : activeTab;

    const handleTabChange = (idx: number) => {
        setLoading(true);
        const tab = TABS[idx];
        const params = new URLSearchParams();
        if (tab.status) params.set('status', tab.status);
        if (tab.isVisible !== undefined) params.set('isVisible', tab.isVisible);
        params.set('page', '1');
        router.push(`/employer/jobs?${params.toString()}`);
    };

    const handlePageChange = (p: number) => {
        setLoading(true);
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(p));
        router.push(`/employer/jobs?${params.toString()}`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa tin tuyển dụng này?')) return;
        const res = await fetch(`/api/employer/jobs/${id}`, { method: 'DELETE' });
        if (res.ok) {
            router.refresh();
        }
    };

    const statusStyle: Record<string, { bg: string; text: string; dot: string; label: string }> = {
        ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Đang hoạt động' },
        PENDING: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Chờ phê duyệt' },
        DRAFT: { bg: 'bg-slate-50', text: 'text-slate-650', dot: 'bg-slate-400', label: 'Tin nháp' },
        CLOSED: { bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500', label: 'Đã đóng' },
        REJECTED: { bg: 'bg-red-50', text: 'text-red-800', dot: 'bg-red-600', label: 'Từ chối' },
    };

    const isHiddenTab = TABS[safeActiveTab].isVisible === 'false';

    return (
        <div className="space-y-8 w-full mx-auto px-4 py-6 text-slate-800 animate-fadeIn">
            {/* Elegant glassmorphic banner header themed with #0052CC */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#0052CC] to-[#0040a2] rounded-3xl p-8 shadow-md text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_120%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-white/95">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Workspace Nhà tuyển dụng
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">
                        Quản lý Tin tuyển dụng
                    </h1>
                    <p className="text-sm text-white/80 max-w-xl">
                        Theo dõi tiến độ duyệt tin, đo lường lượt ứng tuyển, quản lý hồ sơ ứng viên và tối ưu hóa quy trình chiêu mộ nhân tài.
                    </p>
                </div>
            </div>

            {/* Filter, Category & Search form - borderless, shadow-sm */}
            <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('search', searchValue);
                    params.set('page', '1');
                    if (categoryValue) {
                        params.set('category', categoryValue);
                    } else {
                        params.delete('category');
                    }
                    router.push(`/employer/jobs?${params.toString()}`);
                }} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-6 relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Nhập tên tin tuyển dụng muốn tìm kiếm..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 text-sm bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-[#0052CC]/25 transition-all duration-200"
                        />
                    </div>

                    <div className="md:col-span-4 relative">
                        <select
                            value={categoryValue}
                            onChange={(e) => setCategoryValue(e.target.value)}
                            className="w-full h-12 pl-4 pr-10 text-sm bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-[#0052CC]/25 appearance-none cursor-pointer font-bold text-slate-700"
                            style={{
                                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 16px center',
                                backgroundSize: '16px'
                            }}
                        >
                            <option value="">Tất cả danh mục ngành nghề</option>
                            {categoryList.map(c => (
                                <option key={c.id} value={c.slug}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="md:col-span-2 h-12 bg-[#0052CC] hover:bg-[#0040a2] text-white text-sm font-bold rounded-2xl transition-all duration-200 cursor-pointer shadow-md active:scale-98"
                    >
                        Lọc kết quả
                    </button>
                </form>

                {/* Filter Tab pills inside search card - borderless */}
                <div className="pt-2 flex flex-wrap gap-2">
                    {TABS.map((tab, idx) => {
                        const isSelected = safeActiveTab === idx;
                        const isDangerTab = tab.isVisible === 'false';
                        return (
                            <button
                                key={idx}
                                onClick={() => handleTabChange(idx)}
                                className={`px-4 py-2 rounded-2xl text-xs font-bold cursor-pointer transition-all duration-200 ${isSelected
                                    ? isDangerTab
                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/10'
                                        : 'bg-[#0052CC] text-white shadow-md shadow-blue-500/10'
                                    : isDangerTab
                                        ? 'bg-orange-50/50 hover:bg-orange-100 text-orange-700'
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                                    }`}
                            >
                                {isDangerTab && <span className="mr-1.5">🚫</span>}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* List view container */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <div className="w-12 h-12 border-4 border-slate-150 border-t-[#0052CC] rounded-full animate-spin" />
                    <p className="text-xs text-slate-400 font-bold tracking-wide">Đang đồng bộ dữ liệu bản ghi...</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className="bg-white rounded-3xl p-20 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-5">
                        <span className="material-symbols-outlined text-[36px] text-slate-450">work_off</span>
                    </div>
                    {isHiddenTab ? (
                        <p className="text-slate-500 font-semibold text-lg">Không có tin tuyển dụng nào bị ẩn 🛡️</p>
                    ) : (
                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-slate-700">Chưa có tin tuyển dụng nào</h3>
                            <p className="text-sm text-slate-400 max-w-sm mx-auto pb-4">
                                Bạn chưa đăng tuyển bất cứ cơ hội việc làm nào thuộc bộ lọc này. Hãy bắt đầu ngay để tìm ứng viên tiềm năng!
                            </p>
                            <Link href="/employer/jobs/new" className="inline-flex px-6 py-3 bg-[#0052CC] hover:bg-[#0040a2] text-white text-sm font-bold rounded-2xl shadow-md transition-all duration-200">
                                Đăng tin đầu tiên của bạn
                            </Link>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Job Cards - Borderless */}
                    {jobs.map(job => {
                        const style = statusStyle[job.status] || { bg: 'bg-slate-55', text: 'text-slate-700', dot: 'bg-slate-400', label: job.status };
                        return (
                            <div
                                key={job.id}
                                className={`bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col lg:flex-row lg:items-center gap-6 group relative overflow-hidden ${!job.isVisible ? 'bg-orange-50/10' : ''}`}
                            >
                                {/* Glow hover accent bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-transform duration-300 -translate-x-full group-hover:translate-x-0 ${!job.isVisible ? 'bg-orange-500' : 'bg-[#0052CC]'}`} />

                                {/* Info content */}
                                <div className="flex-1 min-w-0 space-y-3">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                        <Link
                                            href={`/jobs/${job.slug}`}
                                            target="_blank"
                                            className="font-extrabold text-slate-900 hover:text-[#0052CC] text-lg tracking-tight leading-snug transition-colors group-hover:text-[#0052CC] flex items-center gap-1"
                                        >
                                            {job.title}
                                            <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[#0052CC]">
                                                open_in_new
                                            </span>
                                        </Link>

                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full ${style.bg} ${style.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
                                                {style.label}
                                            </span>

                                            {!job.isVisible && (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-700">
                                                    🚫 Vô hiệu hóa bởi Admin
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Attributes tags row - Borderless */}
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                                        <span className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl text-slate-600">
                                            <span className="material-symbols-outlined text-[15px] text-[#0052CC]">folder</span> {job.category.name}
                                        </span>
                                        <span className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl text-slate-600">
                                            <span className="material-symbols-outlined text-[15px] text-[#0052CC]">payments</span> {formatSalary(job.salaryMin, job.salaryMax)}
                                        </span>
                                        <span className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl text-slate-600">
                                            <span className="material-symbols-outlined text-[15px] text-[#0052CC]">location_on</span> {job.ward?.name || 'Phú Quốc'}
                                        </span>
                                    </div>

                                    {/* Stats application counts */}
                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-400 font-semibold">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[15px]">group</span> Lượt ứng tuyển: <strong className="text-[#0052CC] font-extrabold">{job._count.applications}</strong> ứng viên
                                        </span>
                                        {job.deadline && (
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[15px]">calendar_month</span> Hạn nộp hồ sơ: <strong className="text-slate-700 font-extrabold">{formatDateVi(job.deadline)}</strong>
                                            </span>
                                        )}
                                    </div>

                                    {/* Admin notices */}
                                    {!job.isVisible && (
                                        <div className="text-xs text-orange-700 bg-orange-50/50 p-3 rounded-2xl leading-relaxed max-w-3xl flex items-start gap-2">
                                            <span className="material-symbols-outlined text-[18px]">warning</span>
                                            <div>
                                                <strong>Tin đăng đang bị ẩn:</strong> Tin tuyển dụng đã bị tắt chế độ hiển thị công khai trên hệ thống. Ứng viên sẽ không tìm thấy hoặc nộp hồ sơ được. Vui lòng liên hệ Admin để duyệt lại.
                                            </div>
                                        </div>
                                    )}

                                    {/* Rejections alerts */}
                                    {job.status === 'REJECTED' && job.rejectReason && (
                                        <div className="text-xs text-rose-700 bg-rose-50 rounded-2xl p-4 max-w-3xl flex items-start gap-2 shadow-inner">
                                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                                            <div className="space-y-1">
                                                <strong>Lý lý do tin bị từ chối phê duyệt:</strong>
                                                <p className="text-rose-600 italic bg-white/60 p-2 rounded-xl mt-1">{job.rejectReason}</p>
                                                <p className="text-[11px] text-slate-500 mt-1.5">
                                                    👉 Vui lòng nhấp vào nút <strong>Chỉnh sửa</strong> để cập nhật lại tin đăng theo yêu cầu của Admin.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons Panel - Borderless style */}
                                <div className="flex lg:flex-col gap-2.5 flex-shrink-0 justify-end lg:w-36 pt-4 lg:pt-0">
                                    <Link
                                        href={`/employer/jobs/${job.id}/edit`}
                                        className="flex-1 lg:flex-initial text-center px-4 py-2.5 text-xs font-bold text-[#0052CC] bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-150 active:scale-98 shadow-sm"
                                    >
                                        Chỉnh sửa tin
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(job.id)}
                                        className="flex-1 lg:flex-initial text-center px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-150 active:scale-98 cursor-pointer"
                                    >
                                        Xóa tin đăng
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Pagination control bar - borderless style */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 bg-white p-5 rounded-3xl shadow-sm">
                            <p className="text-xs font-bold text-slate-450">
                                Hiển thị từ <strong className="text-slate-700 font-extrabold">{(pagination.page - 1) * pagination.limit + 1}</strong> đến <strong className="text-slate-700 font-extrabold">{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> trong tổng số <strong className="text-slate-700 font-extrabold">{pagination.total}</strong> tin đăng
                            </p>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={!pagination.hasPrev}
                                    className="h-10 px-4 text-xs font-bold bg-slate-50 text-slate-650 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
                                >
                                    ← Trước
                                </button>

                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, i) =>
                                        p === '...' ? (
                                            <span key={`dots-${i}`} className="px-1 text-slate-400 text-xs font-bold">…</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => handlePageChange(p as number)}
                                                className={`w-10 h-10 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${pagination.page === p
                                                    ? 'bg-[#0052CC] text-white shadow-md shadow-blue-500/10'
                                                    : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}

                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={!pagination.hasNext}
                                    className="h-10 px-4 text-xs font-bold bg-slate-50 text-slate-650 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
                                >
                                    Tiếp →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}