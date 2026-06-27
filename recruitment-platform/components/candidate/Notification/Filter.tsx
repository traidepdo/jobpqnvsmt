const FILTERS = ["Tất cả", "Chưa đọc", "Việc làm", "Đơn ứng tuyển", "Nhà tuyển dụng", "Hệ thống"];

export default function Filter({
    filter,
    setFilter,
    setPage,
    unreadCount
}: {
    filter: string;
    setFilter: (filter: string) => void;
    setPage: (page: number) => void;
    unreadCount: number;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 mb-3 px-4 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
                {FILTERS.map(f => (
                    <button
                        key={f}
                        onClick={() => { setFilter(f); setPage(1); }}
                        className={`px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${filter === f
                            ? "text-[#00b14f] border-[#00b14f]"
                            : "text-gray-500 border-transparent hover:text-[#041b3c]"
                            }`}
                    >
                        {f}
                        {f === "Chưa đọc" && unreadCount > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}