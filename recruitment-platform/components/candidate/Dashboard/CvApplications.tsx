import { requireCandidate } from '@/lib/requireCandidate';
import { formatDateVi, getApplicationStatusLabel } from "@/lib/jobLabels";
import Link from "next/link";
import { redirect } from 'next/navigation';
import { getRecentApplications } from '@/lib/services/candidate/dashboard';
import ApplicationActionMenu from './ApplicationActionMenu';

const statusConfig: Record<string, { style: string; icon: string }> = {
    PENDING: { style: 'bg-amber-50 text-amber-900 border-amber-200 font-bold', icon: 'schedule' },
    REVIEWING: { style: 'bg-indigo-50 text-indigo-900 border-indigo-200 font-bold', icon: 'visibility' },
    ACCEPTED: { style: 'bg-green-50 text-green-900 border-green-200 font-bold', icon: 'check_circle' },
    REJECTED: { style: 'bg-red-50 text-red-900 border-red-200 font-bold', icon: 'cancel' },
};

export default async function CvApplications() {
    const authResult = await requireCandidate();
    if (authResult.error) {
        redirect('/login');
    }
    const userId = authResult.payload.id;

    const recentApplications = await getRecentApplications(userId);

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-200 transition-all duration-300">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-[#041b3c] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#00b14f] text-[20px]">assignment</span>
                    Đơn ứng tuyển gần đây
                </h3>
                <Link href="/candidate/applications" className="text-sm font-semibold text-[#00b14f] hover:underline">
                    Xem tất cả
                </Link>
            </div>
            
            {recentApplications.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-slate-350 text-[48px] mb-2">description_alert</span>
                    <p className="text-slate-400 text-sm mb-3">Chưa có đơn ứng tuyển nào.</p>
                    <Link href="/jobs" className="px-4 py-2 bg-[#00b14f] hover:bg-[#009940] text-white text-xs font-bold rounded-lg transition-colors">
                        Tìm việc ngay
                    </Link>
                </div>
            ) : (
                <ul className="divide-y divide-gray-50">
                    {recentApplications.map(app => {
                        const statusInfo = statusConfig[app.status] || { style: 'bg-slate-50 text-slate-700 border-slate-100', icon: 'info' };
                        return (
                            <li key={app.id} className="group/item hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-3 px-5 py-4">
                                    <Link href={`/jobs/${app.job.slug}`} className="flex-shrink-0">
                                        <img
                                            src={app.job.company.logo || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=48'}
                                            alt=""
                                            className="w-12 h-12 rounded-xl object-contain border border-slate-200 shadow-sm bg-white p-1"
                                        />
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/jobs/${app.job.slug}`} className="text-sm font-bold text-[#041b3c] hover:text-[#00b14f] transition-colors truncate block">
                                            {app.job.title}
                                        </Link>
                                        <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                                            {app.job.company.name} <span className="text-slate-300">•</span> {formatDateVi(app.createdAt)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${statusInfo.style}`}>
                                            <span className="material-symbols-outlined text-[12px]">{statusInfo.icon}</span>
                                            {getApplicationStatusLabel(app.status)}
                                        </span>
                                        <ApplicationActionMenu
                                            applicationId={app.id}
                                            jobSlug={app.job.slug}
                                            companyName={app.job.company.name}
                                        />
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}