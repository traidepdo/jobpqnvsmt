import { useState, useEffect, useRef } from "react";
import { Notification } from "@/lib/types/candidate/Notification";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/services/candidate/notification";

export function useNotifications(initialNotifications: Notification[]) {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [selected, setSelected] = useState<Notification | null>(null);
    const [filter, setFilter] = useState("Tất cả");
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const limit = 10;

    const isMounted = useRef(false);

    useEffect(() => {
        setNotifications(initialNotifications);
    }, [initialNotifications]);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }

        setLoading(true);

        const timer = setTimeout(() => {
            getNotifications(searchQuery)
                .then(data => {
                    setNotifications(data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const markAsRead = async (id: string) => {
        const success = await markNotificationAsRead(id);
        if (success) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setSelected(prev => prev?.id === id ? { ...prev, isRead: true } : prev);
        }
    };

    const markAllAsRead = async () => {
        const success = await markAllNotificationsAsRead();
        if (success) {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            if (selected) setSelected(prev => prev ? { ...prev, isRead: true } : null);
        }
    };

    const openNotification = (n: Notification) => {
        setSelected(n);
        if (!n.isRead) markAsRead(n.id);
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

    const totalPages = Math.ceil(filtered.length / limit);
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    useEffect(() => {
        if (page > totalPages && totalPages > 0) {
            setPage(totalPages);
        }
    }, [filtered.length, page, totalPages]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return {
        notifications,
        setNotifications,
        selected,
        setSelected,
        filter,
        setFilter,
        loading,
        setLoading,
        page,
        setPage,
        searchQuery,
        setSearchQuery,
        limit,
        markAsRead,
        markAllAsRead,
        openNotification,
        filtered,
        totalPages,
        paginated,
        unreadCount,
    };
}

export const TYPE_CONFIG = {
    job: { icon: "work", label: "Việc làm", color: "#00b14f", bg: "#00b14f15" },
    application: { icon: "description", label: "Đơn ứng tuyển", color: "#f59e0b", bg: "#f59e0b15" },
    employer: { icon: "business", label: "Nhà tuyển dụng", color: "#3b82f6", bg: "#3b82f615" },
    system: { icon: "info", label: "Hệ thống", color: "#8b5cf6", bg: "#8b5cf615" },
};

export const getCategoryKey = (type: string) => {
    if (type === "JOB_APPROVED" || type === "JOB_DEADLINE") return "job";
    if (type === "APPLICATION_RECEIVED" || type === "APPLICATION_STATUS_CHANGED") return "application";
    if (type === "NEW_MESSAGE") return "employer";
    return "system";
};

export const cfg = (type: string) => {
    const cat = getCategoryKey(type);
    return TYPE_CONFIG[cat as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.system;
};

export const formatDate = (dateStr: string) => {
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
