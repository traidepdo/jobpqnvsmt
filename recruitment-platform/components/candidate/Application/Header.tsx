import Link from "next/link"
import { Application } from "@/lib/types/candidate/Application"

export default function Header({ loading, applications }: { loading: boolean; applications: Application[] }) {
    return (
        <>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Việc làm đã ứng tuyển</h1>
                    <p className="text-[13px] text-gray-500 mt-0.5">
                        {loading ? 'Đang tải...' : `${applications.length} đơn ứng tuyển`}
                    </p>
                </div>
                <Link
                    href="/jobs"
                    className="inline-flex items-center gap-1.5 bg-[#00b14f] hover:bg-[#009940] text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Tìm thêm việc làm
                </Link>
            </div>
        </>
    )
}