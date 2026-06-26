import { prisma } from '@/lib/prisma';
import { requireCandidate } from '@/lib/requireCandidate';
import { formatDateVi, getApplicationStatusLabel } from "@/lib/jobLabels";
import Link from "next/link";
import { redirect } from 'next/navigation';
import { getRecentApplications } from '@/lib/services/candidate/dashboard';

const statusStyle: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700',
    REVIEWING: 'bg-indigo-50 text-indigo-700',
    ACCEPTED: 'bg-green-50 text-green-700',
    REJECTED: 'bg-red-50 text-red-700',
};

export default async function CvApplications() {
    const authResult = await requireCandidate();
    if (authResult.error) {
        redirect('/login');
    }
    const userId = authResult.payload.id;

    const recentApplications = await getRecentApplications(userId);

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-[#041b3c]">Đơn ứng tuyển gần đây</h3>
                <Link href="/candidate/applications" className="text-sm font-semibold text-[#00b14f] hover:underline">
                    Xem tất cả
                </Link>
            </div>
            {recentApplications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                    Chưa có đơn ứng tuyển.{' '}
                    <Link href="/jobs" className="text-[#00b14f] font-semibold">Tìm việc ngay</Link>
                </div>
            ) : (
                <ul className="divide-y divide-gray-50">
                    {recentApplications.map(app => (
                        <li key={app.id}>
                            <Link href={`/jobs/${app.job.slug}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                                <img
                                    src={app.job.company.logo || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=48'}
                                    alt=""
                                    className="w-10 h-10 rounded-lg object-contain border bg-gray-50"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#041b3c] truncate">{app.job.title}</p>
                                    <p className="text-xs text-gray-400">{app.job.company.name} · {formatDateVi(app.createdAt)}</p>
                                </div>
                                <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${statusStyle[app.status] || ''}`}>
                                    {getApplicationStatusLabel(app.status)}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}