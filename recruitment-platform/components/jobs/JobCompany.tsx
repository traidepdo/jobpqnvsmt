import Link from "next/link"
import type { MatchedCompany } from "@/lib/types/Job"
export default function JobCompany({ matchedCompanies }: { matchedCompanies: MatchedCompany[] }) {
    return (
        <>
            {matchedCompanies && matchedCompanies.length > 0 && (
                <div className="mb-8 animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-[#00b14f]">corporate_fare</span>
                            Nhà tuyển dụng liên quan
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {matchedCompanies.map((c) => (
                            <Link
                                key={c.id}
                                href={`/companies/${c.slug}`}
                                className="p-5 bg-white border border-slate-100/80 hover:border-[#00b14f]/30 hover:shadow-md active:scale-[0.99] rounded-2xl flex flex-col items-center text-center transition-all duration-300 group relative"
                            >
                                {/* Logo hình tròn */}
                                <div className="w-20 h-20 bg-slate-50 rounded-full p-1 flex items-center justify-center border border-slate-100/50 mb-3 shadow-inner">
                                    {c.logo ? (
                                        <img
                                            src={c.logo}
                                            alt={c.name}
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    ) : (
                                        <span className="material-symbols-outlined text-[24px] text-slate-350">corporate_fare</span>
                                    )}
                                </div>

                                {/* Tên công ty */}
                                <h4 className="font-bold text-slate-800 text-sm group-hover:text-[#00b14f] transition-colors line-clamp-1 mb-0.5 w-full">
                                    {c.name}
                                </h4>

                                {/* Lĩnh vực */}
                                <p className="text-[11px] text-slate-400 font-medium truncate w-full mb-4">
                                    {c.industry || 'Chưa cập nhật'}
                                </p>

                                {/* Nút việc làm nhỏ xinh */}
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00b14f] bg-[#00b14f]/8 group-hover:bg-[#00b14f] group-hover:text-white px-3 py-1 rounded-full transition-all border border-[#00b14f]/5 shadow-sm">
                                    {c._count.jobs} việc làm
                                    <span className="material-symbols-outlined text-[12px] font-bold group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}