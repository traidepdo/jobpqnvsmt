import Link from "next/link";
export default function JobPagination({ totalPages, page, getPageLink }: { totalPages: number, page: number, getPageLink: (page: number) => string }) {

    return (
        <>
            {totalPages > 1 && (
                <nav className="flex justify-center items-center gap-1.5 mt-8" aria-label="Phân trang việc làm">
                    <Link
                        href={getPageLink(page - 1)}
                        className={`w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-[#00b14f] hover:text-[#00b14f] ${page === 1 ? 'pointer-events-none opacity-30 bg-gray-50' : ''}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                        .reduce<(number | '...')[]>((acc, p, i, arr) => {
                            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                            acc.push(p);
                            return acc;
                        }, [])
                        .map((p, i) =>
                            p === '...' ? (
                                <span key={`e-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">...</span>
                            ) : (
                                <Link
                                    key={p}
                                    href={getPageLink(p as number)}
                                    className={`w-9 h-9 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors ${p === page ? 'bg-[#00b14f] text-white shadow-sm shadow-green-200' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#00b14f] hover:text-[#00b14f]'}`}
                                >
                                    {p}
                                </Link>
                            )
                        )}

                    <Link
                        href={getPageLink(page + 1)}
                        className={`w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-[#00b14f] hover:text-[#00b14f] ${page === totalPages ? 'pointer-events-none opacity-30 bg-gray-50' : ''}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </nav>
            )}
        </>
    );
}