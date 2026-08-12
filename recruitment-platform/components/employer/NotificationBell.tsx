"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Notification {
    id: string;
    title: string;
    content: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    refId?: string | null;
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
    application: { icon: "description", color: "#00b14f", bg: "#00b14f15" },
    system: { icon: "info", color: "#8b5cf6", bg: "#8b5cf615" },
    job: { icon: "work", color: "#f59e0b", bg: "#f59e0b15" },
};

const cfg = (type: string) => TYPE_CONFIG[type] ?? TYPE_CONFIG.system;

const formatDate = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return new Date(dateStr).toLocaleDateString("vi-VN");
};

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [selected, setSelected] = useState<Notification | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const getNotificationLink = (n: Notification) => {
        if (!n.refId) return null;
        if (n.type === "NEW_MESSAGE") {
            // We don't have groupConvs loaded here, but we can default to direct or implement a check, 
            // since employer side handles both routing, let's check if the ID is group or direct.
            // Wait, we can redirect to `/employer/messages?id=${n.refId}` or check if we want to pass a type.
            // Wait! In employer/messages page, if activeType defaults to 'direct', but it's a group,
            // we can fetch both group and direct conversation types or support resolving dynamically.
            // Let's pass type=group if the notification type indicates a group message or check.
            // Since NEW_MESSAGE in group is created as GroupMessage, we can detect it if the content has "Tin nhắn nhóm mới".
            const isGroup = n.title.includes("nhóm") || n.content.includes("nhóm");
            return `/employer/messages?id=${n.refId}&type=${isGroup ? 'group' : 'direct'}`;
        }
        if (n.type === "APPLICATION_RECEIVED" || n.type === "APPLICATION_STATUS_CHANGED") {
            return `/employer/applications`;
        }
        return null;
    };

    useEffect(() => {
        fetch("/api/employer/notifications")
            .then(r => r.json())
            .then(data => setNotifications(Array.isArray(data.notifications) ? data.notifications : []))
            .catch(() => setNotifications([]));
    }, []);

    // Đóng khi click ra ngoài
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSelected(null);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;

    const markAsRead = async (id: string) => {
        await fetch(`/api/employer/notifications/${id}/read`, { method: "PATCH" });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setSelected(prev => prev?.id === id ? { ...prev, isRead: true } : prev);
    };

    const markAllAsRead = async () => {
        await fetch("/api/employer/notifications/read-all", { method: "PATCH" });
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setSelected(prev => prev ? { ...prev, isRead: true } : null);
    };

    const openNotification = (n: Notification) => {
        setSelected(n);
        if (!n.isRead) markAsRead(n.id);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell */}
            <button
                onClick={() => { setIsOpen(p => !p); setSelected(null); }}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors relative"
            >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 flex items-start z-50">

                    {/* Panel chi tiết — hiện bên trái */}
                    {selected && (
                        <div className="w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden mr-0 flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cfg(selected.type).bg }}>
                                        <span className="material-symbols-outlined text-[15px]" style={{ color: cfg(selected.type).color }}>
                                            {cfg(selected.type).icon}
                                        </span>
                                    </div>
                                    <span className="font-bold text-sm text-[#041b3c]">Chi tiết</span>
                                </div>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-4 py-4 flex-1 overflow-y-auto max-h-80">
                                <h3 className="font-bold text-[#041b3c] text-sm mb-3 leading-snug">
                                    {selected.title}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                    {selected.content}
                                </p>
                                {getNotificationLink(selected) && (
                                    <Link
                                        href={getNotificationLink(selected)!}
                                        onClick={() => setIsOpen(false)}
                                        className="mt-4 flex items-center justify-center gap-1.5 w-full px-4 py-2 bg-[#00b14f] hover:bg-[#009f47] text-white text-xs font-semibold rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                        Xem chi tiết
                                    </Link>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[13px] text-gray-400">schedule</span>
                                <p className="text-[11px] text-gray-400">{formatDate(selected.createdAt)}</p>
                            </div>
                        </div>
                    )}

                    {/* Danh sách — luôn bên phải */}
                    <div className={`w-80 bg-white flex flex-col shadow-xl border border-gray-100 overflow-hidden
                        ${selected ? "rounded-r-xl border-l-0" : "rounded-xl"}`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <span className="font-bold text-sm text-[#041b3c]">
                                Thông báo{" "}
                                {unreadCount > 0 && <span className="text-[#00b14f]">({unreadCount} mới)</span>}
                            </span>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="text-xs text-[#00b14f] hover:underline font-medium">
                                    Đánh dấu tất cả đã đọc
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <ul className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                            {notifications.length === 0 ? (
                                <li className="px-4 py-8 text-center text-sm text-gray-400">
                                    <span className="material-symbols-outlined text-3xl block mb-2">notifications_off</span>
                                    Không có thông báo nào
                                </li>
                            ) : (
                                notifications.map(n => (
                                    <li
                                        key={n.id}
                                        onClick={() => openNotification(n)}
                                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors
                                            ${!n.isRead ? "bg-[#00b14f]/5" : ""}
                                            ${selected?.id === n.id ? "bg-[#00b14f]/10 border-l-2 border-[#00b14f]" : "border-l-2 border-transparent"}
                                        `}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                                style={{ background: cfg(n.type).bg }}>
                                                <span className="material-symbols-outlined text-[16px]"
                                                    style={{ color: cfg(n.type).color }}>
                                                    {cfg(n.type).icon}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm truncate ${!n.isRead ? "font-semibold text-[#041b3c]" : "font-medium text-gray-600"}`}>
                                                    {n.title}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.content}</p>
                                                <p className="text-[11px] text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                                            </div>
                                            {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#00b14f] flex-shrink-0 mt-1.5" />}
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                                <a href="/employer/notifications" className="text-xs text-[#00b14f] hover:underline font-medium">
                                    Xem tất cả thông báo →
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}