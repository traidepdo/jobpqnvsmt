import { Notification } from "@/lib/types/candidate/Notification";
import { cfg, formatDate } from "@/lib/hooks/useNotifications";

export default function ListNotification({
    notifications,
    loading,
    filtered,
    paginated,
    selected,
    openNotification,
    page,
    limit,
    totalPages,
    setPage,
}: {
    notifications: Notification[];
    loading: boolean;
    filtered: Notification[];
    paginated: Notification[];
    selected: Notification | null;
    openNotification: (notification: Notification) => void;
    page: number;
    limit: number;
    totalPages: number;
    setPage: (page: number | ((p: number) => number)) => void;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {loading ? (
                /* Skeleton */
                <div className="divide-y divide-gray-50">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="px-5 py-4 flex gap-4 animate-pulse">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-100 rounded w-3/4" />
                                <div className="h-3 bg-gray-100 rounded w-full" />
                                <div className="h-3 bg-gray-100 rounded w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-200 block mb-3">notifications_off</span>
                    <p className="text-gray-400 font-medium">Không có thông báo nào</p>
                    <p className="text-gray-300 text-sm mt-1">Thử chọn danh mục khác</p>
                </div>
            ) : (
                <>
                    <ul className="divide-y divide-gray-50">
                        {paginated.map(n => {
                            const c = cfg(n.type);
                            const isSelected = selected?.id === n.id;
                            return (
                                <li
                                    key={n.id}
                                    onClick={() => openNotification(n)}
                                    className={`px-5 py-4 cursor-pointer transition-all duration-150 flex gap-4 items-start
                                                        ${!n.isRead ? "bg-[#00b14f]/[0.03]" : "bg-white"}
                                                        ${isSelected ? "bg-[#00b14f]/[0.06] border-l-[3px] border-[#00b14f]" : "border-l-[3px] border-transparent"}
                                                        hover:bg-gray-50
                                                    `}
                                >
                                    {/* Icon */}
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                        style={{ background: c.bg }}
                                    >
                                        <span
                                            className="material-symbols-outlined text-[20px]"
                                            style={{ color: c.color }}
                                        >
                                            {c.icon}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-[#041b3c]" : "font-medium text-gray-700"}`}>
                                                {n.title}
                                            </p>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-[11px] text-gray-400 whitespace-nowrap">{formatDate(n.createdAt)}</span>
                                                {!n.isRead && (
                                                    <span className="w-2 h-2 rounded-full bg-[#00b14f] flex-shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                            {n.content}
                                        </p>
                                        <span
                                            className="inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold rounded-full"
                                            style={{ color: c.color, background: c.bg }}
                                        >
                                            {c.label}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/30">
                            <p className="text-xs text-gray-500">
                                Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, filtered.length)} trên {filtered.length} thông báo
                            </p>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                                    disabled={page === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, i) =>
                                        p === '...' ? (
                                            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">…</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p as number)}
                                                className={`w-8 h-8 flex items-center justify-center text-xs font-semibold rounded-lg border transition-colors ${page === p
                                                    ? "bg-[#00b14f] text-white border-[#00b14f]"
                                                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}
                                <button
                                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                                    disabled={page === totalPages}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}