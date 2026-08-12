'use server';
import { requireCandidate } from "@/lib/requireCandidate";
import { getNotificationsServer, markAllNotificationsAsRead, markNotificationAsRead } from "@/server/services/candidate/notification.services";
import { redirect } from "next/navigation";

async function authUsed(): Promise<{ success: boolean, message?: string, userId?: string }> {
    const auth = await requireCandidate();
    if (!auth || !auth.payload?.id) {
        return { success: false, message: "Người dùng chưa đăng nhập", userId: "" };
    }
    const userId = auth.payload.id;
    return { success: true, userId };
}


export const markAllNotificationAsReadAction = async () => {
    const authResult = await authUsed();
    if (!authResult.success || !authResult.userId) {
        return { success: false, message: authResult.message || "Người dùng chưa đăng nhập" };
    }
    const userId = authResult.userId;
    const res = await markAllNotificationsAsRead(userId);
    return res;
};

export const markNotificationAsReadAction = async (id: string) => {
    const authResult = await authUsed();
    if (!authResult.success || !authResult.userId) {
        return { success: false, message: authResult.message || "Người dùng chưa đăng nhập" };
    }
    const userId = authResult.userId;
    const res = await markNotificationAsRead(userId, id);
    return res;
};

