"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { formatSalary } from '@/lib/jobLabels';

interface JobItem {
    id: string;
    title: string;
    slug: string;
    salaryMin: number | null;
    salaryMax: number | null;
    experience: string | null;
    deadline: Date | string | null;
    category: {
        name: string;
    };
}

interface CompanyJobsListProps {
    jobs: JobItem[];
}

export default function CompanyJobsList({ jobs }: CompanyJobsListProps) {
    const [showAll, setShowAll] = useState(false);
    const initialCount = 3;

    if (!jobs || jobs.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400 text-sm">
                Hiện tại doanh nghiệp chưa đăng tin tuyển dụng mới nào.
            </div>
        );
    }

    const visibleJobs = showAll ? jobs : jobs.slice(0, initialCount);

    return (
        <div className="space-y-4">
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
                            >
                                <span className="material-symbols-outlined text-[16px] font-bold">arrow_forward</span>
                            </Link>
                        </div>
                    </article>
                ))}
            </div>

            {jobs.length > initialCount && (
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
                                Xem thêm {jobs.length - initialCount} việc làm khác
                                <span className="material-symbols-outlined text-[16px]">expand_more</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
