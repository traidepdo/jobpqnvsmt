'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { unfollowCompany } from '@/lib/services/candidate/followedcompany';
import UnfollowCompany from '@/components/candidate/FollowedCompany/UnfollowCompany';
import { FollowedCompanyItem } from '@/lib/types/candidate/FollowCompany';
import Render from './Render';
import RenderNotFollow from './RenderNotFollow';


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
        <div className="w-full space-y-4">
            <p className="text-sm text-gray-500">{items.length} công ty đang theo dõi</p>

            {items.length === 0 ? (
                <RenderNotFollow />
            ) : (
                <Render items={items} handleUnfollowCompany={handleUnfollowCompany} />
            )}
            <UnfollowCompany
                unfollowingId={unfollowingId}
                setUnfollowingId={setUnfollowingId}
                confirmUnfollow={confirmUnfollow}
            />
        </div>
    );
}

