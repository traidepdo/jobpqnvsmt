import Link from "next/link";

export default function Breadcrumbs({
    query,
    category,
    getCategoryName
}: {
    query: string;
    category: string;
    getCategoryName: (category: string) => string;
}) {
    return (
        <nav className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-4 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#00b14f] transition-colors">Trang chủ</Link>
            <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/jobs" className={`hover:text-[#00b14f] transition-colors ${!query && !category ? 'text-[#00b14f] font-medium pointer-events-none' : ''}`}>
                Việc làm Phú Quốc
            </Link>
            {category && (
                <>
                    <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-[#00b14f] font-medium">{getCategoryName(category)}</span>
                </>
            )}
            {query && (
                <>
                    <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-[#00b14f] font-medium">Tìm &quot;{query}&quot;</span>
                </>
            )}
        </nav>
    );
}