"use server"

import { requireCandidate } from "@/lib/requireCandidate";
import { ApplicationService } from "@/server/services/candidate/application.services";
import { CreateApplicationInput } from "@/lib/types/candidate/Application";
import { createApplicationSchema } from '@/server/schemas/candidate/application.schema';

export async function auth() {
    const auth = await requireCandidate();
    if (!auth || !auth.payload?.id) {
        throw new Error("Yêu cầu đăng nhập để ứng tuyển.");
    }
    return auth.payload.id;
}
export async function getApplicationAction() {
    const userId = await auth();
    try {
        const applications = await ApplicationService.get(userId);
        return {
            success: true,
            message: "",
            applications
        };
    } catch (e: any) {
        console.error(e);
        return {
            success: false,
            message: e.message,
            applications: []
        };
    }
}

export async function createApplicationAction(params: Omit<CreateApplicationInput, "userId">) {
    const userId = await auth();
    try {
        const validate = createApplicationSchema.safeParse({ ...params, userId });
        if (!validate.success) {
            console.error("Application validation error:", validate.error.format());
            return { success: false, message: validate.error.issues[0]?.message || "Dữ liệu không hợp lệ" };
        }
        await ApplicationService.create(validate.data);
        return { success: true, message: "Ứng tuyển thành công" };
    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message };
    }
}

export async function cancelApplicationAction(id: string) {
    const userId = await auth();
    try {
        await ApplicationService.delete(id, userId);
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}