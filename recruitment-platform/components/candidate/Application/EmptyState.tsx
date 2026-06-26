import Link from "next/link";
export default function EmptyState({ filtered }: { filtered: boolean }) {
    return (
        <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <p className="font-semibold text-gray-700 text-base mb-1">
                {filtered ? 'Không có đơn nào với trạng thái này' : 'Bạn chưa ứng tuyển công việc nào'}
            </p>
            <p className="text-sm text-gray-400 mb-5">
                {filtered ? 'Thử chọn trạng thái khác' : 'Hãy tìm kiếm và ứng tuyển ngay hôm nay!'}
            </p>
            {!filtered && (
                <Link
                    href="/jobs"
                    className="inline-flex items-center gap-1.5 bg-[#00b14f] hover:bg-[#009940] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Tìm việc làm
                </Link>
            )}
        </div>
    );
}