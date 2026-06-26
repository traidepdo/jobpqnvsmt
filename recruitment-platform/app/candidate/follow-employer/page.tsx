import { requireCandidate } from '@/lib/requireCandidate';
import { redirect } from 'next/navigation';
import ClientFollowCompany from '@/components/candidate/FollowedCompany/ClientFollowCompany';
import { getFollowCompany } from '@/lib/services/candidate/followedcompany';

export default async function CandidateFollowedCompaniesPage() {
    const auth = await requireCandidate();
    if (auth.error || !auth.payload) {
        redirect('/login');
    }
    const data = await getFollowCompany(auth.payload.id);

    // Chuẩn hóa Date thành String để truyền từ Server Component sang Client Component
    const initialItems = data.map(item => ({
        ...item,
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
    }));

    return (
        <div className="w-full">
            <ClientFollowCompany initialItems={initialItems as any} />
        </div>
    );
}
