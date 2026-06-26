'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatDateVi, formatSalary, getJobTypeLabel } from '@/lib/jobLabels';
import { SavedItem } from '@/lib/types/candidate/SavedJob';

export default function ClientSavedJob({ initialItems }: { initialItems: SavedItem[] }) {
    const [items, setItems] = useState<SavedItem[]>(initialItems);
    const [loading, setLoading] = useState(false);

    const handleUnsave = async (jobId: string) => {
        const res = await fetch(`/api/candidate/saved-jobs?jobId=${jobId}`, { method: 'DELETE' });
        if (res.ok) setItems(prev => prev.filter(i => i.job.id !== jobId));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <p className="text-sm text-gray-500">{items.length} việc làm đã lưu</p>

            {items.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">bookmark</span>
                    <p className="font-semibold text-gray-600 mb-1">Chưa lưu việc làm nào</p>
                    <p className="text-sm text-gray-400 mb-6">Lưu tin tuyển dụng để xem lại sau</p>
                    <Link href="/jobs" className="inline-flex px-6 py-2.5 bg-[#00b14f] text-white font-bold rounded-lg text-sm">
                        Khám phá việc làm
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map(item => (
                        <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-5 flex gap-4 shadow-sm">
                            <img
                                src={item.job.company.logo || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=64'}
                                alt=""
                                className="w-14 h-14 rounded-lg object-contain border bg-gray-50 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <Link href={`/jobs/${item.job.slug}`} className="font-bold text-[#041b3c] hover:text-[#00b14f]">
                                    {item.job.title}
                                </Link>
                                <p className="text-sm text-[#00b14f] font-medium">{item.job.company.name}</p>
                                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                                    <span>{formatSalary(item.job.salaryMin, item.job.salaryMax)}</span>
                                    <span>{item.job.ward?.name || 'Phú Quốc'}</span>
                                    <span>{getJobTypeLabel(item.job.type)}</span>
                                    <span>Đã lưu {formatDateVi(item.createdAt)}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                                <Link
                                    href={`/jobs/${item.job.slug}`}
                                    className="px-4 py-2 text-xs font-bold text-white bg-[#00b14f] rounded-lg text-center hover:bg-[#009940]"
                                >
                                    Xem & ứng tuyển
                                </Link>
                                <button
                                    onClick={() => handleUnsave(item.job.id)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                >
                                    Bỏ lưu
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
