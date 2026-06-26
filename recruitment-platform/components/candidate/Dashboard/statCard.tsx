import { requireCandidate } from '@/lib/requireCandidate';
import { redirect } from 'next/navigation';
import { getCandidateStats } from '@/lib/services/candidate/dashboard';

export default async function StatCard() {
    const authResult = await requireCandidate();
    if (authResult.error) {
        redirect('/login');
    }
    const userId = authResult.payload.id;

    const { applications, savedJobs, resumes, accepted } = await getCandidateStats(userId);

    const cards = [
        { label: 'Đã ứng tuyển', value: applications, icon: 'description', color: '#6366f1' },
        { label: 'Việc đã lưu', value: savedJobs, icon: 'bookmark', color: '#ef4444' },
        { label: 'CV đã tạo', value: resumes, icon: 'article', color: '#00b14f' },
        { label: 'Được chấp nhận', value: accepted, icon: 'check_circle', color: '#10b981' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(card => (
                <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <span className="material-symbols-outlined text-[28px] mb-2" style={{ color: card.color }}>
                        {card.icon}
                    </span>
                    <p className="text-2xl font-extrabold text-[#041b3c]">{card.value}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
                </div>
            ))}
        </div>
    );
}