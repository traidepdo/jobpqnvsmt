"use client";
import { useState, useEffect, useRef } from "react";
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

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<Notification | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const getNotificationLink = (n: Notification) => {
        if (!n.refId) return null;
        if (n.type === "NEW_MESSAGE") {
            return `/candidate/messages?id=${n.refId}`;
        }
        if (n.type === "APPLICATION_STATUS_CHANGED" || n.type === "APPLICATION_RECEIVED") {
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
            .then(data => setNotifications(data.notifications ?? []));
    }, []);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSelected(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAsRead = async (id: string) => {
        await fetch(`/api/candidate/notifications/${id}/read`, { method: "PATCH" });
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setSelected(prev => prev?.id === id ? { ...prev, read: true } : prev);
    };

    const markAllAsRead = async () => {
        await fetch("/api/candidate/notifications/read-all", { method: "PATCH" });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const openNotification = (n: Notification) => {
        setSelected(n);
        if (!n.isRead) markAsRead(n.id);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => { setIsOpen(prev => !prev); setSelected(null); }}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer relative"
            >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                // Chỉ bọc thẻ relative để làm mốc tọa độ
                <div className="absolute right-0 mt-2 z-50">
                    <div className="relative">

                        {/* ── Cột trái: danh sách (Giữ nguyên luồng gốc) ── */}
                        <div className="w-80 bg-white flex flex-col shadow-xl rounded-xl border border-gray-100 overflow-hidden relative z-10">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                <span className="font-bold text-sm text-[#041b3c]">
                                    Thông báo{" "}
                                    {unreadCount > 0 && (
                                        <span className="text-[#00b14f]">({unreadCount} mới)</span>
                                    )}
                                </span>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-[#00b14f] hover:underline font-medium"
                                    >
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
                                        ><button >
                                                <div className="flex items-start gap-3">

                                                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.isRead ? "bg-[#00b14f]" : "bg-gray-200"}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm truncate ${!n.isRead ? "font-semibold text-[#041b3c]" : "font-medium text-gray-600"}`}>
                                                            {n.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                            {n.content}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 mt-1">
                                                            {new Date(n.createdAt).toLocaleDateString("vi-VN", {
                                                                day: "2-digit", month: "2-digit", year: "numeric",
                                                                hour: "2-digit", minute: "2-digit",
                                                            })}
                                                        </p>
                                                    </div>
                                                    <span className="material-symbols-outlined text-[16px] text-gray-300 mt-1 flex-shrink-0">
                                                        chevron_right
                                                    </span>
                                                </div>
                                            </button>
                                        </li>
                                    ))
                                )}
                            </ul>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                                    <a href="/candidate/notifications" className="text-xs text-[#00b14f] hover:underline font-medium">
                                        Xem tất cả thông báo →
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* ── Cột phải: nội dung chi tiết (Dùng Absolute để văng ra bên phải) ── */}
                        {selected && (
                            <div className="absolute top-0 left-[calc(100%+16px)] h-full w-80 bg-white flex flex-col shadow-xl rounded-xl border border-gray-100 overflow-hidden z-20">
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
                                    <span className="font-bold text-sm text-[#041b3c]">Chi tiết</span>
                                    <button
                                        onClick={() => setSelected(null)}
                                        className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">close</span>
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/50">
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
                                            className="inline-flex items-center gap-1.5 mt-4 text-sm text-[#00b14f] font-semibold hover:underline"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                            Xem chi tiết
                                        </Link>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-4 py-3 border-t border-gray-100 bg-white mt-auto">
                                    <p className="text-[11px] text-gray-400">
                                        {new Date(selected.createdAt).toLocaleDateString("vi-VN", {
                                            day: "2-digit", month: "2-digit", year: "numeric",
                                            hour: "2-digit", minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
            }
        </div >
    );
}