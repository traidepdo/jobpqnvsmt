'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatDateVi } from '@/lib/jobLabels';

interface FollowedCompanyItem {
    id: string;
    createdAt: string;
    company: {
        id: string;
        name: string;
        logo: string | null;
        description: string | null;
    };
}

export default function CandidateFollowedCompaniesPage() {
    const [items, setItems] = useState<FollowedCompanyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/candidate/follow-employer')
            .then(r => r.json())
            .then(d => setItems(d.follows || []))
            .finally(() => setLoading(false));
    }, []);

    const handleUnfollow = async (companyId: string) => {
        setUnfollowingId(companyId);
        try {
            const res = await fetch(`/api/candidate/follow-employer?companyId=${companyId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setItems(prev => prev.filter(i => i.company.id !== companyId));
            }
        } finally {
            setUnfollowingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <p className="text-sm text-gray-500">{items.length} công ty đang theo dõi</p>

            {items.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-300 block mb-3">business</span>
                    <p className="font-semibold text-gray-600 mb-1">Chưa theo dõi công ty nào</p>
                    <p className="text-sm text-gray-400 mb-6">
                        Theo dõi các công ty để cập nhật tin tuyển dụng mới nhất
                    </p>
                    <Link
                        href="/companies"
                        className="inline-flex px-6 py-2.5 bg-[#00b14f] text-white font-bold rounded-lg text-sm hover:bg-[#009940] transition-colors"
                    >
                        Khám phá công ty
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map(item => (
                        <div
                            key={item.id}
                            className="bg-white rounded-xl border border-gray-100 p-5 flex gap-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <img
                                src={item.company.logo || '/placeholder-company.png'}
                                alt={item.company.name}
                                className="w-16 h-16 rounded-lg object-contain border border-gray-100 bg-gray-50 flex-shrink-0"
                                onError={e => {
                                    (e.target as HTMLImageElement).src = '/placeholder-company.png';
                                }}
                            />

                            <div className="flex-1 min-w-0">
                                <Link
                                    href={`/companies/${item.company.id}`}
                                    className="font-bold text-[#041b3c] hover:text-[#00b14f] text-base block mb-1 transition-colors"
                                >
                                    {item.company.name}
                                </Link>
                                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                    {item.company.description || 'Chưa có thông tin giới thiệu về công ty này.'}
                                </p>
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                    <span>Đã theo dõi từ {formatDateVi(item.createdAt)}</span>
                                </div>
                            </div>

                            <div className="flex-shrink-0 flex items-center">
                                <button
                                    onClick={() => handleUnfollow(item.company.id)}
                                    disabled={unfollowingId === item.company.id}
                                    className="px-4 py-2 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {unfollowingId === item.company.id ? 'Đang xử lý...' : 'Bỏ theo dõi'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
