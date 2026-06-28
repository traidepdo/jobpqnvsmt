export default function Detailcv({ id, count, address, summary }: { id: string, count: number, address: string | null, summary: string | null }) {
    return (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex items-center text-sm text-gray-600">
                <span className="material-symbols-outlined text-sm mr-2 text-[18px] text-gray-400">send</span>
                <span>Đã ứng tuyển: <strong className="text-[#041b3c]">{count} lần</strong></span>
            </div>
            {
                address && (
                    <div className="flex items-center text-sm text-gray-500 truncate">
                        <span className="material-symbols-outlined text-sm mr-2 text-[18px] text-gray-400">location_on</span>
                        <span>{address}</span>
                    </div>
                )
            }
            {
                summary && (
                    <p className="text-sm text-gray-500 line-clamp-2 mt-2 leading-relaxed bg-gray-50/50 p-2.5 rounded-lg border border-gray-50">
                        {summary}
                    </p>
                )
            }
        </div>
    )
}