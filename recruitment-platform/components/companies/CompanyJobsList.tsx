"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatSalary } from '@/lib/jobLabels';
import { JobItem } from '@/lib/types/companydetail';

interface CompanyJobsListProps {
    jobs: JobItem[];
}

type SortOption = 'newest' | 'salary_desc';
type StatusFilter = 'all' | 'active' | 'expired';

export default function CompanyJobsList({ jobs }: CompanyJobsListProps) {
    const [showAll, setShowAll] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const initialCount = 4;

    const isExpiredJob = (job: JobItem) => {
        if (job.status === 'EXPIRED' || job.status === 'CLOSED') return true;
        if (job.deadline) {
            const deadlineTime = new Date(job.deadline).getTime();
            return deadlineTime < Date.now();
        }
        return false;
    };

    // Extract unique categories for filter
    const categories = useMemo(() => {
        const set = new Set<string>();
        jobs.forEach(job => {
            if (job.category?.name) {
                set.add(job.category.name);
            }
        });
        return Array.from(set);
    }, [jobs]);

    // Filter and Sort Jobs
    const processedJobs = useMemo(() => {
        let list = [...jobs];

        // Apply status filter
        if (statusFilter === 'active') {
            list = list.filter(job => !isExpiredJob(job));
        } else if (statusFilter === 'expired') {
            list = list.filter(job => isExpiredJob(job));
        }

        // Apply category filter
        if (selectedCategory !== 'all') {
            list = list.filter(job => job.category?.name === selectedCategory);
        }

        // Apply sort
        if (sortBy === 'salary_desc') {
            list.sort((a, b) => {
                const maxA = a.salaryMax || a.salaryMin || 0;
                const maxB = b.salaryMax || b.salaryMin || 0;
                return maxB - maxA;
            });
        }

        return list;
    }, [jobs, selectedCategory, statusFilter, sortBy]);

    if (!jobs || jobs.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-2xl">work_off</span>
                </div>
                <p className="text-slate-600 font-bold">Chưa có tin tuyển dụng nào</p>
                <p className="text-slate-400 text-xs mt-1">Doanh nghiệp chưa đăng tải vị trí công việc mới nào.</p>
            </div>
        );
    }

    const visibleJobs = showAll ? processedJobs : processedJobs.slice(0, initialCount);

    return (
        <div className="space-y-4">
            {/* Filter and Sort Bar */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-slate-200/60">
                    {/* Status Filter Tabs */}
                    <div className="flex items-center gap-1 p-0.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setStatusFilter('all')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${statusFilter === 'all'
                                ? 'bg-[#00b14f] text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[13px]">grid_view</span>
                            <span>Tất cả ({jobs.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('active')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${statusFilter === 'active'
                                ? 'bg-[#00b14f] text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[13px] text-emerald-500">check_circle</span>
                            <span>Đang tuyển ({jobs.filter(j => !isExpiredJob(j)).length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusFilter('expired')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${statusFilter === 'expired'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[13px] text-rose-500">cancel</span>
                            <span>Hết hạn ({jobs.filter(j => isExpiredJob(j)).length})</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 self-end md:self-auto text-[11px]">
                        <span className="font-extrabold text-slate-500">Sắp xếp:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 outline-none focus:border-[#00b14f] cursor-pointer"
                        >
                            <option value="newest">Mới nhất</option>
                            <option value="salary_desc">Lương cao nhất</option>
                        </select>
                    </div>
                </div>

                {/* Category Pills Filter */}
                {categories.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 text-[11px]">
                        <span className="font-extrabold text-slate-500 mr-1">Ngành nghề:</span>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={`px-2.5 py-0.5 rounded-md font-bold transition cursor-pointer ${selectedCategory === 'all'
                                ? 'bg-slate-800 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                        >
                            Tất cả
                        </button>
                        {categories.map((cat) => {
                            const count = jobs.filter(j => j.category?.name === cat).length;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-2.5 py-0.5 rounded-md font-bold transition cursor-pointer ${selectedCategory === cat
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                        }`}
                                >
                                    {cat} ({count})
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Jobs List */}
            {processedJobs.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 p-5 text-slate-400 text-[11px] font-semibold">
                    Không tìm thấy tin tuyển dụng nào phù hợp với bộ lọc hiện tại.
                </div>
            ) : (
                <div className="grid gap-3">
                    {visibleJobs.map((job) => {
                        const expired = isExpiredJob(job);
                        const deadlineDate = job.deadline ? new Date(job.deadline) : null;

                        return (
                            <article
                                key={job.id}
                                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative group ${expired
                                    ? 'bg-slate-50/70 border-slate-200/90 shadow-2xs opacity-85 hover:opacity-100'
                                    : 'bg-white border-slate-200/80 shadow-sm hover:border-[#00b14f]/50 hover:shadow-md hover:shadow-[#00b14f]/5'
                                    }`}
                            >
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {/* Status Badge */}
                                        {expired ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200/80">
                                                <span className="material-symbols-outlined text-[12px] text-rose-600">error</span>
                                                <span>ĐÃ HẾT HẠN TUYỂN DỤNG</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <span className="material-symbols-outlined text-[12px] text-emerald-600">check_circle</span>
                                                <span>ĐANG TUYỂN DỤNG</span>
                                            </span>
                                        )}

                                        {job.category?.name && (
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                                {job.category.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* Job Title */}
                                    <Link
                                        href={`/jobs/${job.slug}`}
                                        className={`font-black text-sm md:text-base block tracking-tight transition-colors line-clamp-1 ${expired
                                            ? 'text-slate-600 hover:text-[#00b14f] line-through decoration-slate-400/60'
                                            : 'text-slate-800 hover:text-[#00b14f]'
                                            }`}
                                    >
                                        {job.title}
                                    </Link>

                                    {/* Job Attributes / Badges */}
                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                        <span className="font-extrabold text-[#008f40] bg-[#00b14f]/10 px-2.5 py-0.5 rounded-lg border border-[#00b14f]/20 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[13px]">payments</span>
                                            <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                                        </span>

                                        {job.ward?.name && (
                                            <span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[13px]">location_on</span>
                                                {job.ward.name}
                                            </span>
                                        )}

                                        {job.experience && (
                                            <span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[13px]">work_history</span>
                                                {job.experience}
                                            </span>
                                        )}

                                        <span className={`px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1 border ${expired
                                            ? 'bg-rose-50 text-rose-600 border-rose-200'
                                            : 'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                            <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                            {deadlineDate
                                                ? `Hạn nộp: ${deadlineDate.toLocaleDateString('vi-VN')}`
                                                : 'Hạn nộp: Không giới hạn'}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-1 md:pt-0">
                                    <Link
                                        href={`/jobs/${job.slug}`}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 ${expired
                                            ? 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                                            : 'bg-[#00b14f] hover:bg-[#009940] text-white shadow-xs active:scale-95'
                                            }`}
                                    >
                                        <span>{expired ? 'Xem thông tin' : 'Ứng tuyển ngay'}</span>
                                        <span className="material-symbols-outlined text-[13px] font-bold">arrow_forward</span>
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {processedJobs.length > initialCount && (
                <div className="pt-2 text-center">
                    <button
                        type="button"
                        onClick={() => setShowAll(!showAll)}
                        className="inline-flex items-center gap-1.5 px-5 py-2 text-[11px] font-black text-[#00b14f] hover:text-white bg-[#00b14f]/10 hover:bg-[#00b14f] rounded-xl transition-all duration-300 cursor-pointer active:scale-95 border-none"
                    >
                        {showAll ? (
                            <>
                                <span>Thu gọn danh sách</span>
                                <span className="material-symbols-outlined text-[14px] rotate-180 transition-transform">expand_more</span>
                            </>
                        ) : (
                            <>
                                <span>Xem thêm {processedJobs.length - initialCount} công việc khác</span>
                                <span className="material-symbols-outlined text-[14px]">expand_more</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
