'use client';

import Link from 'next/link';
import { useState } from 'react';
import { unfollowCompany } from '@/lib/services/candidate/followedcompany';
import { FollowedCompanyItem } from '@/lib/types/candidate/FollowCompany';
import { formatDateVi } from '@/lib/jobLabels';

export default function ClientFollowCompany({
    initialItems,
}: {
    initialItems: FollowedCompanyItem[];
}) {
    const [items, setItems] = useState<FollowedCompanyItem[]>(initialItems);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
    const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

    const handleUnfollowCompany = (companyId: string) => {
        setUnfollowingId(companyId);
    };

    const confirmUnfollow = async () => {
        if (!unfollowingId) return;
        const result = await unfollowCompany(unfollowingId);
        if (result.success) {
            setItems(prev => prev.filter(i => i.company.id !== unfollowingId));
        }
        setUnfollowingId(null);
    };

    const sortedItems = [...items].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return (
        <div className="w-full space-y-6 animate-fadeIn pb-10">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6 sm:p-8 border border-emerald-500/10">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-[#00b14f] font-bold">business</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#009940]">Nhà tuyển dụng</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            Công ty đang theo dõi
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Xem thông tin cập nhật và các cơ hội tuyển dụng mới nhất từ các doanh nghiệp
                        </p>
                    </div>
                    <Link
                        href="/jobs"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00b14f] hover:bg-[#009940] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-[#00b14f]/10 hover:shadow-[#00b14f]/20 active:scale-95 self-start sm:self-auto"
                    >
                        <span className="material-symbols-outlined text-base">explore</span>
                        Khám phá công ty
                    </Link>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-12 translate-x-12" />
            </div>

            {/* Filter and stats row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100/80">
                <p className="text-sm text-slate-500">
                    Bạn đang theo dõi <span className="font-semibold text-slate-700">{items.length}</span> doanh nghiệp
                </p>
                {items.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Sắp xếp theo:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                            <option value="newest">Mới theo dõi gần đây</option>
                            <option value="oldest">Theo dõi lâu nhất</option>
                        </select>
                    </div>
                )}
            </div>

            {items.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">business_surveys</span>
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">
                        Chưa theo dõi công ty nào
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mb-5">
                        Theo dõi công ty để nhận được thông báo tuyển dụng và tin tức mới nhất từ họ.
                    </p>
                    <Link
                        href="/jobs"
                        className="inline-flex items-center px-5 py-2 bg-[#00b14f] hover:bg-[#009940] text-white font-bold rounded-lg text-xs transition-all active:scale-95"
                    >
                        Xem danh sách việc làm
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedItems.map(item => (
                        <div
                            key={item.id}
                            className="group bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col shadow-[0_2px_12px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:border-slate-200/60 transition-all duration-300"
                        >
                            {/* Banner/Cover Image */}
                            <div className="relative h-28 w-full overflow-hidden bg-slate-100 flex-shrink-0">
                                {item.company.coverImage ? (
                                    <img
                                        src={item.company.coverImage}
                                        alt={`${item.company.name} cover`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6 sm:p-8 border border-emerald-500/10" />
                                )}
                                <div className="absolute inset-0 bg-slate-900/10" />
                            </div>

                            {/* Card Body */}
                            <div className="p-5 pt-0 flex-1 flex flex-col relative">
                                {/* Logo overlapping banner */}
                                <div className="relative -mt-8 mb-3 w-16 h-16 rounded-xl border-2 border-white bg-white flex items-center justify-center p-1.5 shadow-md group-hover:scale-105 transition-transform duration-300 flex-shrink-0 z-10">
                                    <img
                                        src={item.company.logo || '/placeholder-company.png'}
                                        alt={item.company.name}
                                        className="w-full h-full object-contain rounded-lg"
                                        onError={e => {
                                            (e.target as HTMLImageElement).src = '/placeholder-company.png';
                                        }}
                                    />
                                </div>

                                {/* Content info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <Link
                                            href={`/companies/${item.company.slug}`}
                                            className="font-bold text-slate-800 hover:text-[#00b14f] text-base block transition-colors line-clamp-1 mb-1"
                                        >
                                            {item.company.name}
                                        </Link>
                                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                                            {item.company.description || 'Chưa có thông tin giới thiệu về công ty này.'}
                                        </p>
                                    </div>

                                    {/* Date & Button */}
                                    <div className="border-t border-slate-50 pt-4 flex items-center justify-between gap-2 mt-auto">
                                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                                            <span>Theo dõi {formatDateVi(item.createdAt)}</span>
                                        </div>

                                        <button
                                            onClick={() => handleUnfollowCompany(item.company.id)}
                                            className="px-3 py-1.5 text-xs font-bold text-slate-500 border border-slate-200 rounded-lg hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50/40 transition-all duration-200 cursor-pointer active:scale-95"
                                        >
                                            Bỏ theo dõi
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Unfollow Confirmation Modal */}
            {unfollowingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setUnfollowingId(null)} />
                    <div className="relative bg-white rounded-xl max-w-sm w-full p-5 shadow-xl z-10 text-center animate-slideUp border border-slate-100">
                        <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3 text-rose-500">
                            <span className="material-symbols-outlined text-xl">warning</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mb-1.5">Xác nhận bỏ theo dõi?</h3>
                        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                            Bạn sẽ không nhận được các thông báo tuyển dụng mới nhất từ công ty này nữa.
                        </p>
                        <div className="flex gap-2.5">
                            <button
                                onClick={() => setUnfollowingId(null)}
                                className="flex-1 py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmUnfollow}
                                className="flex-1 py-2 text-xs font-bold text-white bg-rose-500 rounded-lg hover:bg-rose-600 transition-all active:scale-95 cursor-pointer"
                            >
                                Bỏ theo dõi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
