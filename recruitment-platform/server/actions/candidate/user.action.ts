"use server";

import { prisma } from "@/lib/prisma";
import { UpdateCandidateProfileInput, User } from "@/lib/types/candidate/profile";
import { UpdateCandidateProfileSchema } from "@/server/schemas/candidate/user.schema";
import { updateCandidateProfileService } from "@/server/services/candidate/user.services";

export async function updateCandidateProfile(
    userId: string,
    data: UpdateCandidateProfileInput
): Promise<{
    success: boolean;
    user: User | undefined;
    error?: string;
}> {
    const validatedData = UpdateCandidateProfileSchema.safeParse(data);
    if (!validatedData.success) {
        const errordata = validatedData.error.issues.map((issue) => issue.message).join(" và ");
        return { success: false, user: undefined, error: errordata };
    }
    try {
        const result = await updateCandidateProfileService.update(userId, validatedData.data);
        if (result.success) {
            return { success: true, user: result.user, error: undefined };
        }
        return { success: false, user: undefined, error: result.error };
    } catch (error) {
        console.error("Error updating candidate profile:", error);
        return { success: false, user: undefined, error: "Failed to update candidate profile" };
    }
}


