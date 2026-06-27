"use client";
import Link from "next/link";
import { Notification } from "@/lib/types/candidate/Notification";
import { useNotifications, getCategoryKey } from "@/lib/hooks/useNotifications";
import Header from "./Header";
import Search from "./Search";
import Filter from "./Filter";
import ListNotification from "./ListNotification";

const TYPE_CONFIG = {
    job: { icon: "work", label: "Việc làm", color: "#00b14f", bg: "#00b14f15" },
    application: { icon: "description", label: "Đơn ứng tuyển", color: "#f59e0b", bg: "#f59e0b15" },
    employer: { icon: "business", label: "Nhà tuyển dụng", color: "#3b82f6", bg: "#3b82f615" },
    system: { icon: "info", label: "Hệ thống", color: "#8b5cf6", bg: "#8b5cf615" },
};

const FILTERS = ["Tất cả", "Chưa đọc", "Việc làm", "Đơn ứng tuyển", "Nhà tuyển dụng", "Hệ thống"];

const getNotificationLink = (n: Notification) => {
    if (!n.refId) return null;
    if (n.type === "NEW_MESSAGE" || n.type === "APPLICATION_STATUS_CHANGED") {
        return `/candidate/messages?id=${n.refId}`;
    }
    if (n.type === "APPLICATION_RECEIVED") {
        return `/candidate/applications`;
    }
    if (n.type === "JOB_APPROVED" || n.type === "JOB_DEADLINE") {
        return `/jobs/${n.refId}`;
    }
    return null;
};

const cfg = (type: string) => {
    const cat = getCategoryKey(type);
    return TYPE_CONFIG[cat as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.system;
};

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export default function ClientNotification({ initialNotifications }: { initialNotifications: Notification[] }) {
    const {
        notifications,
        selected,
        setSelected,
        filter,
        setFilter,
        loading,
        page,
        setPage,
        searchQuery,
        setSearchQuery,
        limit,
        markAllAsRead,
        openNotification,
        filtered,
        totalPages,
        paginated,
        unreadCount,
    } = useNotifications(initialNotifications);

    return (
        <div className="min-h-screen bg-[#f4f5f5]">
            <div className="max-w-[1200px] mx-auto px-6 py-6">
                {/* Page Header */}
                <Header unreadCount={unreadCount} markAllAsRead={markAllAsRead} />

                <div className="flex gap-6 items-start">
                    {/* ── Left: List ── */}
                    <div className="flex-1 min-w-0">
                        {/* Search bar */}
                        <Search searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

                        {/* Filter tabs */}
                        <Filter filter={filter} setFilter={setFilter} setPage={setPage} unreadCount={unreadCount} />

                        {/* Notification list */}
                        <ListNotification
                            notifications={notifications}
                            loading={loading}
                            filtered={filtered}
                            paginated={paginated}
                            selected={selected}
                            openNotification={openNotification}
                            page={page}
                            limit={limit}
                            totalPages={totalPages}
                            setPage={setPage}
                        />
                    </div>

                    {/* ── Right: Detail panel ── */}
                    <div className="w-[380px] flex-shrink-0 sticky top-20">
                        {selected ? (
                            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                {/* Detail header */}
                                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ background: cfg(selected.type).bg }}
                                        >
                                            <span
                                                className="material-symbols-outlined text-[18px]"
                                                style={{ color: cfg(selected.type).color }}
                                            >
                                                {cfg(selected.type).icon}
                                            </span>
                                        </div>
                                        <span className="font-bold text-sm text-[#041b3c]">Chi tiết thông báo</span>
                                    </div>
                                    <button
                                        onClick={() => setSelected(null)}
                                        className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                    </button>
                                </div>

                                {/* Detail body */}
                                <div className="px-5 py-5">
                                    <span
                                        className="inline-block mb-3 px-2.5 py-1 text-[11px] font-semibold rounded-full"
                                        style={{ color: cfg(selected.type).color, background: cfg(selected.type).bg }}
                                    >
                                        {cfg(selected.type).label}
                                    </span>
                                    <h2 className="font-bold text-[#041b3c] text-base leading-snug mb-4">
                                        {selected.title}
                                    </h2>
                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                        {selected.content}
                                    </p>

                                    {getNotificationLink(selected) && (
                                        <Link
                                            href={getNotificationLink(selected)!}
                                            className="mt-5 flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#00b14f] hover:bg-[#009f47] text-white text-sm font-semibold rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                            Xem chi tiết
                                        </Link>
                                    )}
                                </div>

                                {/* Detail footer */}
                                <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[14px] text-gray-400">schedule</span>
                                    <p className="text-[11px] text-gray-400">
                                        {new Date(selected.createdAt).toLocaleDateString("vi-VN", {
                                            weekday: "long", day: "2-digit", month: "2-digit",
                                            year: "numeric", hour: "2-digit", minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Empty state for detail panel */
                            <div className="bg-white rounded-xl border border-gray-100 py-16 flex flex-col items-center text-center px-6">
                                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-3xl text-gray-300">notifications</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-400">Chọn thông báo để xem nội dung</p>
                                <p className="text-xs text-gray-300 mt-1">Chi tiết thông báo sẽ hiển thị ở đây</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
