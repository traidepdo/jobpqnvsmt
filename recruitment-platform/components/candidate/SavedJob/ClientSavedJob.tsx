'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateVi, formatSalary, getJobTypeLabel } from '@/lib/jobLabels';
import { SavedItem } from '@/lib/types/candidate/SavedJob';
import { useSavedJob } from '@/lib/hooks/useSavedJob';

interface Metadata {
    total: number;
    page: number;
    limit: number;
    query?: string;
    totalPages: number;
}

export default function ClientSavedJob({
    initialItems,
    metadata
}: {
    initialItems: SavedItem[];
    metadata: Metadata;
}) {
    const { items, searchQuery, setSearchQuery, handleSearch, handlePageChange, handleUnsave, getPageNumbers, router } = useSavedJob(initialItems, metadata);

    return (
        <div className="w-full space-y-8 animate-fadeIn">
            {/* Header Section with subtle gradient background */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6 sm:p-8 border border-emerald-500/10">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-[#00b14f] font-bold">bookmark</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#009940]">Ứng viên</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            Việc làm đã lưu
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Theo dõi và ứng tuyển nhanh các tin tuyển dụng bạn đã lưu
                        </p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-sm font-medium text-slate-600">Tổng số tin:</span>
                        <span className="text-lg font-bold text-[#00b14f]">{metadata.total}</span>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00b14f]/5 rounded-full blur-3xl -translate-y-12 translate-x-12" />
            </div>

            {/* Search Bar - modern card style */}
            <form onSubmit={handleSearch} className="group relative flex gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100 focus-within:border-[#00b14f]/50 focus-within:shadow-[#00b14f]/5 transition-all duration-300">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00b14f] transition-colors">
                        search
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm theo tiêu đề công việc, công ty, ngành nghề..."
                        className="w-full pl-11 pr-4 py-3 text-sm bg-transparent border-0 rounded-xl focus:outline-none focus:ring-0 text-slate-800 placeholder-slate-400"
                    />
                </div>
                <button
                    type="submit"
                    className="px-6 py-2.5 text-sm font-bold text-white bg-[#00b14f] hover:bg-[#009940] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                    <span className="material-symbols-outlined text-base">search</span>
                    Tìm kiếm
                </button>
            </form>

            {/* Reset Filter Action */}
            {metadata.query && (
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 self-start w-fit animate-slideIn">
                    <span>Kết quả tìm kiếm cho từ khóa: <strong>"{metadata.query}"</strong></span>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            router.push('/candidate/saved');
                        }}
                        className="flex items-center gap-0.5 text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer border-l border-slate-200 pl-2 ml-1"
                    >
                        <span className="material-symbols-outlined text-xs">close</span>
                        Xóa lọc
                    </button>
                </div>
            )}

            {/* Job list / Empty state */}
            {items.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <span className="material-symbols-outlined text-4xl text-slate-400">bookmark_border</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                        {metadata.query ? 'Không tìm thấy việc làm phù hợp' : 'Chưa lưu việc làm nào'}
                    </h3>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
                        {metadata.query
                            ? 'Hãy thử tìm kiếm với một từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh sách.'
                            : 'Đăng nhập, tìm kiếm các cơ hội việc làm hấp dẫn và lưu lại để ứng tuyển bất cứ lúc nào.'}
                    </p>
                    {!metadata.query && (
                        <Link
                            href="/jobs"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00b14f] hover:bg-[#009940] text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-[#00b14f]/10 hover:shadow-[#00b14f]/20 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-base">explore</span>
                            Khám phá việc làm ngay
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map(item => {
                        // Check if job is newly added (e.g. within last 3 days)
                        const isNew = Date.now() - new Date(item.job.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000;

                        return (
                            <div
                                key={item.id}
                                className="group relative bg-white rounded-xl border border-slate-100 p-4.5 flex flex-col md:flex-row gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:border-slate-200/50 transition-all duration-300"
                            >
                                {/* Company Logo */}
                                <div className="relative w-12 h-12 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-center p-1.5 flex-shrink-0 self-start md:self-center shadow-inner group-hover:scale-105 transition-transform duration-200">
                                    <img
                                        src={item.job.company.logo || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=64'}
                                        alt={item.job.company.name}
                                        className="w-full h-full object-contain rounded"
                                    />
                                    {isNew && (
                                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#00b14f] text-[7px] font-bold text-white items-center justify-center scale-90">N</span>
                                        </span>
                                    )}
                                </div>

                                {/* Job Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <Link
                                                href={`/jobs/${item.job.slug}`}
                                                className="font-bold text-slate-800 hover:text-[#00b14f] transition-colors text-sm sm:text-base line-clamp-1 pr-2"
                                            >
                                                {item.job.title}
                                            </Link>
                                        </div>
                                        <p className="text-xs text-[#00b14f] font-semibold mt-0.5 hover:underline cursor-pointer">
                                            {item.job.company.name}
                                        </p>
                                    </div>

                                    {/* Badges/Tags */}
                                    <div className="flex flex-wrap gap-2 text-[11px] mt-2.5">
                                        {item.job.deadline && new Date(item.job.deadline) < new Date() && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-600 font-bold border border-red-100">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                Đã hết hạn
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50/40 text-[#00b14f] font-bold">
                                            <span className="material-symbols-outlined text-[14px]">payments</span>
                                            {formatSalary(item.job.salaryMin, item.job.salaryMax)}
                                        </span>
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50/40 text-blue-600 font-semibold">
                                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                                            {item.job.ward?.name || 'Phú Quốc'}
                                        </span>
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50/40 text-indigo-600 font-semibold">
                                            <span className="material-symbols-outlined text-[14px]">work</span>
                                            {getJobTypeLabel(item.job.type)}
                                        </span>
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-400">
                                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                            Đã lưu {formatDateVi(item.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex md:flex-col gap-2 w-full md:w-auto justify-end md:justify-center border-t md:border-0 border-slate-50 pt-3 md:pt-0 flex-shrink-0">
                                    {item.job.deadline && new Date(item.job.deadline) < new Date() ? (
                                        <button
                                            disabled
                                            className="flex-1 md:flex-none px-4 py-2 text-xs font-bold text-gray-400 bg-gray-100 border border-gray-200 rounded-lg text-center cursor-not-allowed"
                                        >
                                            Hết hạn nộp
                                        </button>
                                    ) : (
                                        <Link
                                            href={`/jobs/${item.job.slug}`}
                                            className="flex-1 md:flex-none px-4 py-2 text-xs font-bold text-white bg-[#00b14f] hover:bg-[#009940] rounded-lg text-center shadow-md shadow-[#00b14f]/5 hover:shadow-[#00b14f]/15 active:scale-95 transition-all duration-200"
                                        >
                                            Xem & ứng tuyển
                                        </Link>
                                    )}
                                    <button
                                        onClick={() => handleUnsave(item.job.id)}
                                        className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg hover:bg-rose-50/30 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-0.5"
                                    >
                                        <span className="material-symbols-outlined text-base">bookmark_remove</span>
                                        Bỏ lưu
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Premium Pagination Controls */}
            {metadata.totalPages > 1 && (
                <div className="flex justify-center items-center gap-1.5 pt-8">
                    <button
                        onClick={() => handlePageChange(metadata.page - 1)}
                        disabled={metadata.page === 1}
                        className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>

                    {getPageNumbers().map((pageNum, idx) => (
                        pageNum === '...' ? (
                            <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center text-slate-400">...</span>
                        ) : (
                            <button
                                key={`page-${pageNum}`}
                                onClick={() => handlePageChange(Number(pageNum))}
                                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer ${metadata.page === pageNum
                                    ? 'bg-[#00b14f] text-white shadow-md shadow-[#00b14f]/10'
                                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        )
                    ))}

                    <button
                        onClick={() => handlePageChange(metadata.page + 1)}
                        disabled={metadata.page === metadata.totalPages}
                        className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                </div>
            )}
        </div>
    );
}
