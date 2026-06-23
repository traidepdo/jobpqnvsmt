
import Link from "next/link";

interface Job {
    slug: string;
    name: string;
    logo: string | null;
    totalApplies: number;
}

export default function CompaniesHot({ featuredCompanies }: { featuredCompanies: Job[] }) {
    return (
        <>
            {featuredCompanies.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mt-4">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-[13px] font-semibold text-gray-800">Công ty Hot</h3>
                        <Link href="/companies" className="text-[12px] text-[#00b14f] hover:underline font-medium">
                            Xem tất cả
                        </Link>
                    </div>
                    <div className="p-3 space-y-2">
                        {featuredCompanies.map(c => (
                            <Link
                                key={c.slug}
                                href={`/jobs?company=${c.slug}`}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                            >
                                <div className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {c.logo ? (
                                        <img src={c.logo} alt={c.name} className="w-full h-full object-contain p-0.5" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#00b14f]/10 to-[#00b14f]/20 flex items-center justify-center">
                                            <span className="text-[#00b14f] font-bold text-sm">{c.name.charAt(0)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-medium text-gray-800 group-hover:text-[#00b14f] transition-colors line-clamp-1">{c.name}</p>
                                    <p className="text-[11px] text-gray-400 font-semibold">{c.totalApplies} lượt ứng tuyển</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}