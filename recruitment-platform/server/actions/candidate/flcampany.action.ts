'use server';
import { requireCandidate } from "@/lib/requireCandidate";
import { folowCampany } from "@/server/services/candidate/flcampany.services";


export async function authUser(): Promise<{ success: boolean, message?: string, userId?: string }> {
    const auth = await requireCandidate();
    if (!auth || !auth.payload?.id) {
        return { success: false, message: "Người dùng chưa đăng nhập", userId: "" };
    }
    const userId = auth.payload.id;
    return { success: true, userId };
}

export const unfollowCompany = async (companyId: string) => {
    const auth = await authUser();
    if (!auth.success) {
        return { success: false, message: "Người dùng chưa đăng nhập" };
    }
    const result = await folowCampany.delete(auth.userId || "", companyId);
    if (result.success) {
        return { success: true };
    }
    return { success: false, message: result.message };
}

export const followCompany = async (companyId: string) => {
    const auth = await authUser();
    if (!auth.success) {
        return { success: false, message: "Người dùng chưa đăng nhập" };
    }
    const result = await folowCampany.add(auth.userId || "", companyId);
    if (result.success) {
        return { success: true };
    }
    return { success: false, message: result.message };
}