import Link from "next/link"

interface CompanyItem {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
    logo?: string | null;
    _count?: {
        jobs: number;
    };
}

interface CompanyTopProps {
    companies: CompanyItem[];
}

export default function CompanyTop({ companies }: CompanyTopProps) {
    return (
        <section className="py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.03) 0%, rgba(34,197,94,0.01) 100%)', borderTop: '1px solid rgba(22,163,74,0.08)', borderBottom: '1px solid rgba(22,163,74,0.08)' }}>
            <div className="w-[1300px] mx-auto px-6">
                <div className="text-center mb-12">
                    <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-[#00b14f] bg-green-50 px-3.5 py-1.5 rounded-full mb-3" style={{ letterSpacing: '0.12em' }}>
                        ✦ Đối tác tuyển dụng
                    </span>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                        Nhà tuyển dụng nổi bật
                    </h2>
                    <p className="text-gray-500 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
                        Những doanh nghiệp hàng đầu đang mở rộng cơ hội việc làm hấp dẫn và chào đón nhân tài tại Phú Quốc.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 mt-10">
                    {companies.map((company: CompanyItem) => (
                        <Link
                            key={company.id}
                            href={`/jobs?query=${encodeURIComponent(company.name)}`}
                            className="group flex flex-col items-center bg-white border border-gray-100 hover:border-green-300 rounded-3xl p-6 text-center relative overflow-hidden cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.015)]"
                            style={{
                                transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                        >
                            {/* Shimmer Light Reflection effect */}
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full"
                                style={{
                                    transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            />

                            {/* Double Glowing background blobs */}
                            <div
                                className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20"
                                style={{
                                    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            />
                            <div
                                className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#00b14f]/5 rounded-full blur-xl group-hover:bg-[#00b14f]/15"
                                style={{
                                    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            />

                            {/* Bottom sliding gradient border indicator */}
                            <div
                                className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-emerald-500 via-green-400 to-[#00b14f] scale-x-0 group-hover:scale-x-100 origin-left"
                                style={{
                                    transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            />

                            {/* Company Logo container */}
                            <div
                                className="w-18 h-18 rounded-2xl bg-gray-50 border border-gray-100/50 flex items-center justify-center overflow-hidden mb-4 group-hover:bg-white group-hover:border-green-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.015)]"
                                style={{
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.01)',
                                    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            >
                                {company.logo ? (
                                    <img
                                        src={company.logo}
                                        alt={company.name}
                                        className="w-full h-full object-contain p-2 group-hover:scale-105"
                                        style={{
                                            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                                        }}
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full bg-green-50/50 flex items-center justify-center text-3xl group-hover:scale-105"
                                        style={{
                                            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                                        }}
                                    >
                                        🏢
                                    </div>
                                )}
                            </div>

                            {/* Company Name */}
                            <h3
                                className="text-xs font-bold text-gray-800 group-hover:text-[#00b14f] line-clamp-1 w-full px-1"
                                style={{
                                    transition: 'color 0.4s ease'
                                }}
                            >
                                {company.name}
                            </h3>

                            {/* Job Count Badge */}
                            <div
                                className="bg-green-50/70 text-[#00b14f] text-[10px] font-extrabold px-3 py-1.5 rounded-full mt-4 flex items-center gap-1.5 group-hover:bg-[#00b14f] group-hover:text-white group-hover:shadow-[0_4px_12px_rgba(0,177,79,0.25)]"
                                style={{
                                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            >
                                <span className="material-symbols-outlined text-[12px] font-bold">work</span>
                                <span>{company._count?.jobs || 0} tin tuyển dụng</span>
                            </div>

                            {/* Arrow icon sliding right */}
                            <div
                                className="flex items-center gap-1 text-[10px] font-extrabold text-[#00b14f] mt-4 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
                                style={{
                                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            >
                                <span>Xem ngay</span>
                                <span className="material-symbols-outlined text-xs font-bold">arrow_forward</span>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <Link
                        href="/companies"
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#00b14f] bg-green-50/50 hover:bg-[#00b14f] hover:text-white px-6 py-3 rounded-2xl border border-green-100 hover:border-[#00b14f] transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 cursor-pointer"
                    >
                        <span>Xem thêm công ty</span>
                        <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                    </Link>
                </div>
            </div>
        </section>
    )
}