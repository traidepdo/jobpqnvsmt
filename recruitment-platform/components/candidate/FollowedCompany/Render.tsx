import { FollowedCompanyItem } from "@/lib/types/candidate/FollowCompany";
import Link from "next/link";
import { formatDateVi } from "@/lib/jobLabels";

export default function Render({ items, handleUnfollowCompany }: { items: FollowedCompanyItem[], handleUnfollowCompany: (companyId: string) => void }) {
    return (
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
                            onClick={() => handleUnfollowCompany(item.company.id)}
                            className="px-4 py-2 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors cursor-pointer"
                        >
                            Bỏ theo dõi
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}