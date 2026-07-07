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
        { href: '/tao-cv', icon: 'add_circle', label: 'Tạo CV mới', desc: 'Mẫu chuyên nghiệp', isPrimary: true },
        { href: '/candidate/resumes', icon: 'article', label: 'CV đã tạo', desc: `${resumes} hồ sơ`, isPrimary: false },
        { href: '/candidate/saved', icon: 'bookmark', label: 'Việc đã lưu', desc: `${savedJobs} tin`, isPrimary: false },
        { href: '/candidate/applications', icon: 'description', label: 'Đơn ứng tuyển', desc: `${applications} đơn`, isPrimary: false },
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-slate-200 transition-all duration-300">
            <h3 className="font-bold text-[#041b3c] mb-4">Truy cập nhanh</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
                            item.isPrimary
                                ? "bg-[#00b14f] border-transparent text-white shadow-sm shadow-[#00b14f]/20 hover:bg-[#009940]"
                                : "border-slate-100 bg-white hover:border-slate-350 hover:bg-slate-50"
                        }`}
                    >
                        <span className={`material-symbols-outlined ${item.isPrimary ? "text-white" : "text-[#00b14f]"}`}>{item.icon}</span>
                        <div>
                            <p className={`text-sm font-bold ${item.isPrimary ? "text-white" : "text-[#041b3c]"}`}>{item.label}</p>
                            <p className={`text-xs ${item.isPrimary ? "text-white/80" : "text-gray-400 font-medium"}`}>{item.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
