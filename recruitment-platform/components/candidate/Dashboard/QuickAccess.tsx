import { requireCandidate } from '@/lib/requireCandidate';
import { getQuickAccess } from '@/lib/services/candidate/dashboard';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function QuickAccess() {
    const authResult = await requireCandidate();
    if (authResult.error) {
        redirect('/login');
    }
    const userId = authResult.payload.id;

    const [resumes, savedJobs, applications] = await getQuickAccess(userId);

    const items = [
        { href: '/candidate/resumes', icon: 'article', label: 'CV đã tạo', desc: `${resumes} hồ sơ` },
        { href: '/candidate/saved', icon: 'bookmark', label: 'Việc đã lưu', desc: `${savedJobs} tin` },
        { href: '/candidate/applications', icon: 'description', label: 'Đơn ứng tuyển', desc: `${applications} đơn` },
        { href: '/tao-cv', icon: 'add_circle', label: 'Tạo CV mới', desc: 'Mẫu chuyên nghiệp' },
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-[#041b3c] mb-4">Truy cập nhanh</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#00b14f]/40 hover:bg-[#00b14f]/5 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[#00b14f]">{item.icon}</span>
                        <div>
                            <p className="text-sm font-semibold text-[#041b3c]">{item.label}</p>
                            <p className="text-xs text-gray-400">{item.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
