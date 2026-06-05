"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

type Notification = {
    id: string;
    title: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    refId?: string | null;
    type: string;
};

const TYPE_CONFIG = {
    job: { icon: "work", label: "Việc làm", color: "#00b14f", bg: "#00b14f15" },
    application: { icon: "description", label: "Đơn ứng tuyển", color: "#f59e0b", bg: "#f59e0b15" },
    employer: { icon: "business", label: "Nhà tuyển dụng", color: "#3b82f6", bg: "#3b82f615" },
    system: { icon: "info", label: "Hệ thống", color: "#8b5cf6", bg: "#8b5cf615" },
};

const FILTERS = ["Tất cả", "Chưa đọc", "Việc làm", "Đơn ứng tuyển", "Nhà tuyển dụng", "Hệ thống"];

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [selected, setSelected] = useState<Notification | null>(null);
    const [filter, setFilter] = useState("Tất cả");
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        fetch("/api/candidate/notifications")
            .then(r => r.json())
            .then(data => {
                setNotifications(data.notifications ?? []);
                setLoading(false);
            });
    }, []);

    const markAsRead = async (id: string) => {
        await fetch(`/api/candidate/notifications/${id}/read`, { method: "PATCH" });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setSelected(prev => prev?.id === id ? { ...prev, isRead: true } : prev);
    };

    const markAllAsRead = async () => {
        await fetch("/api/candidate/notifications/read-all", { method: "PATCH" });
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        if (selected) setSelected(prev => prev ? { ...prev, isRead: true } : null);
    };

    const openNotification = (n: Notification) => {
        setSelected(n);
        if (!n.isRead) markAsRead(n.id);
    };

    const getCategoryKey = (type: string) => {
        if (type === "JOB_APPROVED" || type === "JOB_DEADLINE") return "job";
        if (type === "APPLICATION_RECEIVED" || type === "APPLICATION_STATUS_CHANGED") return "application";
        if (type === "NEW_MESSAGE") return "employer";
        return "system";
    };

    const filtered = notifications.filter(n => {
        const cat = getCategoryKey(n.type);
        if (filter === "Tất cả") return true;
        if (filter === "Chưa đọc") return !n.isRead;
        if (filter === "Việc làm") return cat === "job";
        if (filter === "Đơn ứng tuyển") return cat === "application";
        if (filter === "Nhà tuyển dụng") return cat === "employer";
        if (filter === "Hệ thống") return cat === "system";
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

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

    return (
        <div className="min-h-screen bg-[#f4f5f5]">
            {/* Top bar breadcrumb */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
                    <Link href="/" className="hover:text-[#00b14f] transition-colors">Trang chủ</Link>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-[#041b3c] font-medium">Thông báo</span>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-6 py-6">
                {/* Page Header */}
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

                <div className="flex gap-6 items-start">
                    {/* ── Left: List ── */}
                    <div className="flex-1 min-w-0">
                        {/* Filter tabs */}
                        <div className="bg-white rounded-xl border border-gray-100 mb-3 px-4 overflow-x-auto">
                            <div className="flex gap-1 min-w-max">
                                {FILTERS.map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
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

                        {/* Notification list */}
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
                                <ul className="divide-y divide-gray-50">
                                    {filtered.map(n => {
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
                            )}
                        </div>
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