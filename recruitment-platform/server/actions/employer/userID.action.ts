'use server';

import { requireEmployer } from "@/lib/requireEmployer";

export async function getUserID() {
    try {
        const auth = await requireEmployer();
        if (auth.error) {
            return { success: false, message: auth.error };
        }
        return { success: true, data: auth.company?.id };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}