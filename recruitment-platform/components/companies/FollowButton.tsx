'use client';

import { useState } from 'react';
import { unfollowCompany, followCompany } from '@/server/actions/candidate/flcampany.action';
interface FollowButtonProps {
    companyId: string;
    initialFollowed: boolean;
    isLoggedIn: boolean;
}

export default function FollowButton({ companyId, initialFollowed, isLoggedIn }: FollowButtonProps) {
    const [isFollowed, setIsFollowed] = useState(initialFollowed);
    const [loading, setLoading] = useState(false);

    const handleFollowToggle = async () => {
        if (!isLoggedIn) {
            window.location.href = `/login?callbackUrl=/companies/${companyId}`;
            return;
        }

        if (loading) return;
        setLoading(true);

        try {
            if (isFollowed) {
                const result = await unfollowCompany(companyId);
                if (result.success) {
                    setIsFollowed(false);
                } else {
                    alert(result.message || "Có lỗi xảy ra, vui lòng thử lại");
                }
            } else {
                const result = await followCompany(companyId);
                if (result.success) {
                    setIsFollowed(true);
                } else {
                    alert(result.message || "Có lỗi xảy ra, vui lòng thử lại");
                }
            }
        } catch {
            alert("Lỗi kết nối máy chủ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleFollowToggle}
            disabled={loading}
            className={`w-full md:w-auto px-6 py-2.5 font-bold rounded-lg text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${isFollowed
                    ? "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                    : "bg-[#00b14f] text-white border-[#00b14f] hover:bg-[#009940]"
                }`}
        >
            <span className="material-symbols-outlined text-[18px]">
                {isFollowed ? "check_circle" : "add"}
            </span>
            {isFollowed ? "Đang theo dõi" : "Theo dõi công ty"}
        </button>
    );
}
