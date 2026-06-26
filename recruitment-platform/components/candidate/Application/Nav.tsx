import Link from "next/link"
export default function Nav() {
    return (
        <>
            <nav className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-5">
                <Link href="/" className="hover:text-[#00b14f] transition-colors">Trang chủ</Link>
                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-[#00b14f] font-medium">Việc làm đã ứng tuyển</span>
            </nav>
        </>
    );
}