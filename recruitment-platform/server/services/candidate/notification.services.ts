import { Notification } from "@/lib/types/candidate/Notification";
import { prisma } from "@/lib/prisma"

export const markNotificationAsRead = async (userId: string, id: string) => {
    try {
        const notification = await prisma.notification.updateMany({
            where: {
                id: id,
                userId: userId
            },
            data: { isRead: true },
        });
        if (notification.count === 0) {
            return {
                message: "Không tìm thấy thông báo",
                status: 404
            };
        }
        return {
            message: "Đã cập nhật thông báo",
            status: 200
        }; ``
    } catch (error) {
        return {
            message: "Có lỗi xảy ra",
            status: 500
        };
    }
};

export const markAllNotificationsAsRead = async (userId: string) => {
    try {
        const notifications = await prisma.notification.updateMany({
            where: {
                userId: userId
            },
            data: { isRead: true },
        });
        return true;
    } catch (error) {
        return false;
    }
};

export async function getNotificationsServer(userId: string, searchQuery?: string): Promise<{ notifications: Notification[], unReadCount: number }> {
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
    const result = notifications.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
        refId: n.refId,
        type: n.type,
    }));
    return { notifications: result, unReadCount: result.filter(n => !n.isRead).length };
}