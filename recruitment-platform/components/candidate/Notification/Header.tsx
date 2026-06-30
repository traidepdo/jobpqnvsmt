export default function Header({
    unreadCount,
    markAllAsRead
}: {
    unreadCount: number;
    markAllAsRead: () => void;
}) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6 sm:p-8 border border-emerald-500/10 mb-6">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-[#00b14f] font-bold">notifications</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#009940]">Thông báo</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                        Thông báo của tôi
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {unreadCount > 0 ? (
                            <span>Bạn có <span className="text-[#00b14f] font-bold">{unreadCount} thông báo</span> chưa đọc</span>
                        ) : (
                            "Tất cả thông báo đã được đọc"
                        )}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00b14f] hover:bg-[#009940] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#00b14f]/10 hover:shadow-[#00b14f]/20 active:scale-95 self-start sm:self-auto cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-base">done_all</span>
                        Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-12 translate-x-12" />
        </div>
    );
}