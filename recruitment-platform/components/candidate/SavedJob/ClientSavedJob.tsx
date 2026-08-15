'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateVi, formatSalary, getJobTypeLabel } from '@/lib/jobLabels';
import { SavedItem } from '@/lib/types/candidate/SavedJob';
import { Category } from '@/lib/types/category';
import { useSavedJob } from '@/lib/hooks/useSavedJob';

interface Metadata {
    total: number;
    page: number;
    limit: number;
    query?: string;
    fromDate?: string;
    toDate?: string;
    period?: string;
    category?: string;
    totalPages: number;
}

export default function ClientSavedJob({
    initialItems,
    categories = [],
    metadata,
    userId
}: {
    initialItems: SavedItem[];
    categories?: Category[];
    metadata: Metadata;
    userId: string;
}) {
    const {
        items,
        searchQuery,
        setSearchQuery,
        fromDate,
        setFromDate,
        toDate,
        setToDate,
        period,
        category,
        handleSearch,
        handleCategoryChange,
        handlePeriodChange,
        handleDateRangeApply,
        handleResetFilters,
        handlePageChange,
        handleUnsave,
        getPageNumbers,
        router
    } = useSavedJob(initialItems, metadata, userId);

    return (
        <div className="w-full space-y-8 animate-fadeIn">
            {/* Header Section with subtle gradient background */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600/10 via-teal-500/10 to-emerald-500/5 p-6 sm:p-8 border border-emerald-500/20 shadow-sm backdrop-blur-md">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00b14f]/10 text-[#008f40] text-xs font-extrabold uppercase tracking-wider mb-2">
                            <span className="material-symbols-outlined text-sm">bookmark</span>
                            <span>Danh sách lưu trữ</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                            Việc làm đã lưu
                        </h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            Theo dõi, so sánh và ứng tuyển nhanh các vị trí hấp dẫn bạn đã lưu
                        </p>
                    </div>
                    <div className="bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-emerald-100 shadow-md shadow-emerald-500/5 flex items-center gap-3 self-start sm:self-auto">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#00b14f] flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined">work_history</span>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tổng số tin</p>
                            <p className="text-xl font-black text-[#00b14f] leading-none mt-0.5">{metadata.total}</p>
                        </div>
                    </div>
                </div>
                <div className="absolute -top-12 -right-12 w-56 h-56 bg-[#00b14f]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Search Bar - Ultra modern design */}
            <form onSubmit={handleSearch} className="group relative flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm focus-within:border-[#00b14f] focus-within:ring-4 focus-within:ring-[#00b14f]/15 transition-all duration-300">
                <div className="relative flex-1 flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-slate-400 group-focus-within:text-[#00b14f] transition-colors text-xl">
                        search
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm vị trí công việc, tên công ty, kỹ năng..."
                        className="w-full pl-11 pr-4 py-3 text-sm font-medium bg-transparent border-0 rounded-xl focus:outline-none text-slate-800 placeholder-slate-400"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="mr-2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    className="px-6 py-3 text-sm font-extrabold text-white bg-gradient-to-r from-[#00b14f] to-[#009940] hover:from-[#009940] hover:to-[#008035] rounded-xl transition-all duration-200 shadow-md shadow-[#00b14f]/20 hover:shadow-lg hover:shadow-[#00b14f]/30 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-base">search</span>
                    <span>Tìm kiếm</span>
                </button>
            </form>

            {/* Category & Time Range Toolbar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    {/* Category Selector */}
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#00b14f] flex items-center justify-center">
                            <span className="material-symbols-outlined text-base">category</span>
                        </div>
                        <span className="font-extrabold uppercase tracking-wider text-slate-700">Ngành nghề:</span>
                        <select
                            value={category || 'all'}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00b14f]/20 focus:border-[#00b14f] cursor-pointer"
                        >
                            <option value="all">Tất cả ngành nghề </option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.slug}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Time Filter Pills */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-slate-700">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#00b14f] flex items-center justify-center">
                                <span className="material-symbols-outlined text-base">calendar_month</span>
                            </div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Thời gian lưu:</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/70 rounded-2xl border border-slate-200/50">
                            {[
                                { id: 'all', label: 'Tất cả' },
                                { id: 'today', label: 'Hôm nay' },
                                { id: '7days', label: '7 ngày qua' },
                                { id: '30days', label: '30 ngày qua' },
                                { id: 'thisMonth', label: 'Tháng này' },
                                { id: 'custom', label: 'Tùy chọn' },
                            ].map((p) => {
                                const isActive = period === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => handlePeriodChange(p.id)}
                                        className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer ${isActive
                                            ? 'bg-gradient-to-r from-[#00b14f] to-[#009940] text-white shadow-md shadow-[#00b14f]/25 scale-[1.02]'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                                            }`}
                                    >
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Custom Date Range Inputs */}
                {(period === 'custom' || fromDate || toDate) && (
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs animate-fadeIn">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                            <span className="text-slate-500 font-semibold">Từ:</span>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                            <span className="text-slate-500 font-semibold">Đến:</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => handleDateRangeApply(fromDate, toDate)}
                            className="px-4 py-2 bg-[#00b14f] hover:bg-[#009940] text-white font-extrabold rounded-xl transition cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
                        >
                            <span className="material-symbols-outlined text-sm">filter_alt</span>
                            <span>Áp dụng lọc</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Active Filters Summary & Reset */}
            {(metadata.query || metadata.category || metadata.period || metadata.fromDate || metadata.toDate) && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-emerald-50/50 p-3 px-4 rounded-xl border border-emerald-100 animate-slideIn">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-700">Đang lọc theo:</span>

                        {metadata.query && (
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-semibold text-slate-800 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] text-slate-500">search</span>
                                <span>"{metadata.query}"</span>
                            </span>
                        )}

                        {metadata.category && metadata.category !== 'all' && (
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-[#00b14f] flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] text-[#00b14f]">category</span>
                                <span>{categories.find(c => c.slug === metadata.category || c.id === metadata.category)?.name || metadata.category}</span>
                            </span>
                        )}

                        {metadata.period && metadata.period !== 'all' && metadata.period !== 'custom' && (
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-semibold text-[#00b14f] flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] text-[#00b14f]">calendar_month</span>
                                <span>
                                    {metadata.period === 'today' ? 'Hôm nay' :
                                        metadata.period === '7days' ? '7 ngày qua' :
                                            metadata.period === '30days' ? '30 ngày qua' :
                                                metadata.period === 'thisMonth' ? 'Tháng này' : metadata.period}
                                </span>
                            </span>
                        )}

                        {(metadata.fromDate || metadata.toDate) && (
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-semibold text-[#00b14f] flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] text-[#00b14f]">date_range</span>
                                <span>{metadata.fromDate || '...'} ➔ {metadata.toDate || '...'}</span>
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold cursor-pointer hover:underline"
                    >
                        <span className="material-symbols-outlined text-xs">restart_alt</span>
                        Xóa tất cả lọc
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
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50/40 text-indigo-700 font-semibold">
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
