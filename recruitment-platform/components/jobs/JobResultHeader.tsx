import Link from "next/link"

export default function JobResultHeader({
    query,
    total,
    sort,
    getSortFilterLink,
    SORT_OPTIONS
}: {
    query: string;
    total: number;
    sort: string;
    getSortFilterLink: (sort: string) => string;
    SORT_OPTIONS: { value: string; label: string }[];
}) {
    return (
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div>
                <h1 className="text-lg font-bold text-gray-900">
                    {query ? `Kết quả cho "${query}"` : 'Việc làm Phú Quốc'}
                </h1>
                <p className="text-[13px] text-gray-500 mt-0.5">
                    {total.toLocaleString()} việc làm phù hợp
                </p>
            </div>

            {/* Sắp xếp & JobFlash link */}
            <div className="flex items-center gap-3 flex-wrap">
                <Link
                    href="/job-flash"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-[12px] font-bold shadow-xs hover:from-amber-600 hover:to-orange-600 transition-colors"
                >
                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                    Trang Việc Làm JobFlash
                </Link>

                <div className="flex items-center gap-2">
                    <span className="text-[12px] text-gray-500">Sắp xếp:</span>
                    <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
                        {SORT_OPTIONS.map(s => (
                            <Link
                                key={s.value}
                                href={getSortFilterLink(s.value)}
                                className={`px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${sort === s.value ? 'bg-[#00b14f] text-white' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {s.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}