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

            <p className="text-sm text-slate-500">
                Bạn đang theo dõi <span className="font-semibold text-slate-700">{items.length}</span> doanh nghiệp
            </p>

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
                <div className="space-y-3.5">
                    {items.map(item => (
                        <div
                            key={item.id}
                            className="group bg-white rounded-xl border border-slate-100/80 p-4.5 flex flex-col sm:flex-row gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:border-slate-200/50 transition-all duration-300"
                        >
                            {/* Logo */}
                            <div className="w-14 h-14 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-center p-2 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <img
                                    src={item.company.logo || '/placeholder-company.png'}
                                    alt={item.company.name}
                                    className="w-full h-full object-contain rounded"
                                    onError={e => {
                                        (e.target as HTMLImageElement).src = '/placeholder-company.png';
                                    }}
                                />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <Link
                                    href={`/companies/${item.company.id}`}
                                    className="font-bold text-slate-800 hover:text-emerald-600 text-base block transition-colors"
                                >
                                    {item.company.name}
                                </Link>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                    {item.company.description || 'Chưa có thông tin giới thiệu về công ty này.'}
                                </p>
                                <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-slate-400">
                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                    <span>Đã theo dõi từ {formatDateVi(item.createdAt)}</span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="flex-shrink-0 flex items-center border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0 justify-end">
                                <button
                                    onClick={() => handleUnfollowCompany(item.company.id)}
                                    className="px-3.5 py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-lg hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50/30 transition-all duration-200 cursor-pointer active:scale-95"
                                >
                                    Bỏ theo dõi
                                </button>
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
