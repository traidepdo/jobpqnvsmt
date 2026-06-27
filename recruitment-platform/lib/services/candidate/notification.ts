import { Notification } from "@/lib/types/candidate/Notification";
import { prisma } from "@/lib/prisma"
export const getNotifications = async (searchQuery?: string): Promise<Notification[]> => {
    const url = searchQuery
        ? `/api/candidate/notifications?search=${encodeURIComponent(searchQuery)}`
        : "/api/candidate/notifications";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch notifications");
    const data = await res.json();
    return data.notifications ?? [];
};

export const markNotificationAsRead = async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/candidate/notifications/${id}/read`, { method: "PATCH" });
    return res.ok;
};

export const markAllNotificationsAsRead = async (): Promise<boolean> => {
    const res = await fetch("/api/candidate/notifications/read-all", { method: "PATCH" });
    return res.ok;
};

export async function GetNotification(id: string): Promise<Notification> {
    const noti = await prisma.notification.findUnique({
        where: {
            id: id,
        },
    });
    if (!noti) throw new Error("Notification not found");
    return {
        id: noti.id,
        title: noti.title,
        content: noti.content,
        isRead: noti.isRead,
        createdAt: noti.createdAt.toISOString(),
        refId: noti.refId,
        type: noti.type,
    };
}

export async function getNotificationsServer(userId: string, searchQuery?: string): Promise<Notification[]> {
    const notifications = await prisma.notification.findMany({
        where: {
            userId: userId,
            ...(searchQuery ? {
                OR: [
                    { title: { contains: searchQuery, mode: "insensitive" } },
                    { content: { contains: searchQuery, mode: "insensitive" } },
                ]
            } : {})
        },
        orderBy: { createdAt: "desc" }
    });

    return notifications.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        refId: n.refId,
        type: n.type,
    }));
}