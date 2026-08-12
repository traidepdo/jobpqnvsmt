'use server';

import { revalidatePath } from "next/cache";
import { saveJobService } from "@/server/services/candidate/savejob.services";
import { SaveJobInput } from "@/lib/types/candidate/SavedJob";
import { requireCandidate } from "@/lib/requireCandidate";
import { SaveJobSchema } from '@/server/schemas/candidate/savejob.schema';
async function authUsed(): Promise<{ success: boolean, message?: string, userId?: string }> {
    const auth = await requireCandidate();
    if (!auth || !auth.payload?.id) {
        return { success: false, message: "Người dùng chưa đăng nhập", userId: "" };
    }
    const userId = auth.payload.id;
    return { success: true, userId };
}

export const saveJobAction = async (jobId: string) => {
    try {
        const auth = await authUsed();
        if (!auth.success) {
            return { success: false, message: "Người dùng chưa đăng nhập" };
        }
        const userId = auth.userId || "";
        const validate = SaveJobSchema.safeParse({ userId, jobId });
        if (!validate.success) {
            return { success: false, message: "Dữ liệu không hợp lệ" };
        }
        const result = await saveJobService.save(validate.data);
        if (result.success) {
            return { success: true };
        }
        return { success: false, message: result.message };
    } catch (error) {
        return { success: false, message: "Lỗi hệ thống" };
    }
}

export const delectSaveJobAction = async (jobId: string) => {
    try {
        const auth = await authUsed();
        if (!auth.success) {
            return { success: false, message: "Người dùng chưa đăng nhập" };
        }
        const userId = auth.userId || "";
        const validate = SaveJobSchema.safeParse({ userId, jobId });
        if (!validate.success) {
            return { success: false, message: "Dữ liệu không hợp lệ" };
        }
        const result = await saveJobService.delectSaveJob({ userId, jobId });
        if (result.success) {
            revalidatePath(`/candidate/saved-jobs`);
            return { success: true };
        }
        return { success: false, message: result.message };
    } catch (error) {
        return { success: false, message: "Lỗi hệ thống" };
    }
}