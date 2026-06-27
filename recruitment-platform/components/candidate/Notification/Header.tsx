export default function Header({
    unreadCount,
    markAllAsRead
}: {
    unreadCount: number;
    markAllAsRead: () => void;
}) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-xl font-bold text-[#041b3c]">Thông báo của tôi</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {unreadCount > 0 ? (
                        <span>Bạn có <span className="text-[#00b14f] font-semibold">{unreadCount} thông báo</span> chưa đọc</span>
                    ) : (
                        "Tất cả thông báo đã được đọc"
                    )}
                </p>
            </div>
            {unreadCount > 0 && (
                <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#00b14f] border border-[#00b14f] rounded-lg hover:bg-[#00b14f]/5 transition-colors"
                >
                    <span className="material-symbols-outlined text-[16px]">done_all</span>
                    Đánh dấu tất cả đã đọc
                </button>
            )}
        </div>
    )
}