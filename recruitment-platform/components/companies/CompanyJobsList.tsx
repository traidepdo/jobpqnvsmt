"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatSalary } from '@/lib/jobLabels';
import { JobItem } from '@/lib/types/companydetail';

interface CompanyJobsListProps {
    jobs: JobItem[];
}

type SortOption = 'newest' | 'salary_desc';

export default function CompanyJobsList({ jobs }: CompanyJobsListProps) {
    const [showAll, setShowAll] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const initialCount = 3;

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
    }, [jobs, selectedCategory, sortBy]);

    if (!jobs || jobs.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400 text-sm">
                Hiện tại doanh nghiệp chưa đăng tin tuyển dụng mới nào.
            </div>
        );
    }

    const visibleJobs = showAll ? processedJobs : processedJobs.slice(0, initialCount);

    return (
        <div className="space-y-4">
            {/* Filter and Sort Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 mr-1">Ngành nghề:</span>
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedCategory === 'all'
                                ? 'bg-[#00b14f] text-white'
                                : 'bg-slate-100 text-slate-650 hover:bg-slate-200'
                            }`}
                    >
                        Tất cả ({jobs.length})
                    </button>
                    {categories.map((cat) => {
                        const count = jobs.filter(j => j.category?.name === cat).length;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedCategory === cat
                                        ? 'bg-[#00b14f] text-white'
                                        : 'bg-slate-100 text-slate-650 hover:bg-slate-200'
                                    }`}
                            >
                                {cat} ({count})
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-xs font-semibold text-slate-500">Sắp xếp:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-[#00b14f] cursor-pointer"
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="salary_desc">Lương cao nhất</option>
                    </select>
                </div>
            </div>

            {/* Jobs List */}
            {processedJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                    Không tìm thấy tin tuyển dụng nào phù hợp với bộ lọc.
                </div>
            ) : (
                <div className="space-y-3.5">
                    {visibleJobs.map((job) => (
                        <article
                            key={job.id}
                            className="p-5 border border-gray-100 rounded-2xl bg-white hover:border-[#00b14f]/40 hover:shadow-md active:scale-[0.99] transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative group"
                        >
                            <div className="min-w-0 flex-1">
                                <Link
                                    href={`/jobs/${job.slug}`}
                                    className="font-bold text-gray-850 hover:text-[#00b14f] text-sm md:text-base block truncate mb-2 transition-colors"
                                >
                                    {job.title}
                                </Link>
                                <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500">
                                    <span className="font-semibold text-[#00b14f] bg-[#00b14f]/10 px-2.5 py-1 rounded-lg">
                                        {formatSalary(job.salaryMin, job.salaryMax)}
                                    </span>
                                    <span className="bg-gray-50 text-gray-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">category</span>
                                        {job.category?.name}
                                    </span>
                                    {job.experience && (
                                        <span className="bg-gray-50 text-gray-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">work_history</span>
                                            {job.experience}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 self-end sm:self-center">
                                <span className="text-xs text-gray-400 font-semibold flex items-center gap-1 bg-gray-50/50 px-2.5 py-1.5 rounded-lg border border-gray-100/50">
                                    <span className="material-symbols-outlined text-[14px] text-gray-450">calendar_today</span>
                                    Hạn nộp: {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                                </span>
                                <Link
                                    href={`/jobs/${job.slug}`}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-[#00b14f]/10 hover:bg-[#00b14f] text-[#00b14f] hover:text-white flex items-center justify-center"
                                    aria-label={`Xem chi tiết tin tuyển dụng ${job.title}`}
                                >
                                    <span className="material-symbols-outlined text-[16px] font-bold">arrow_forward</span>
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {processedJobs.length > initialCount && (
                <div className="pt-2 text-center">
                    <button
                        type="button"
                        onClick={() => setShowAll(!showAll)}
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-bold text-[#00b14f] hover:text-white bg-[#00b14f]/10 hover:bg-[#00b14f] rounded-2xl transition-all duration-300 cursor-pointer active:scale-95 shadow-sm border-none"
                    >
                        {showAll ? (
                            <>
                                Thu gọn
                                <span className="material-symbols-outlined text-[16px] rotate-180 transition-transform">expand_more</span>
                            </>
                        ) : (
                            <>
                                Xem thêm {processedJobs.length - initialCount} việc làm khác
                                <span className="material-symbols-outlined text-[16px]">expand_more</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
