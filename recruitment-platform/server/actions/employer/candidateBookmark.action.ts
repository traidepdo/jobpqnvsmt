'use server';

import { ActionResponse } from "@/types/action.type";
import { getUserID } from "@/server/actions/employer/userID.action";
import { CandidateBookmark } from "@/server/services/employer/candidateBookmark.services";
import { requireEmployer } from "@/lib/requireEmployer";
import { bookmarkSchema } from "@/server/schemas/employer/bookmark.schema";

export async function getIsBookmark(prevState: ActionResponse | null): Promise<ActionResponse> {
    const UserId = await getUserID();
    if (!UserId.success) {
        return { success: false, message: UserId.message };
    }
    const data = await CandidateBookmark.getIsBookmark(UserId.data!);
    return { success: true, data: data };
}
export async function handleBookmark(applicationId: string): Promise<ActionResponse> {
    const UserId = await getUserID();
    if (!UserId.success) {
        return { success: false, message: UserId.message };
    }
    const res = await CandidateBookmark.handleBookmark(UserId.data!, applicationId);
    if (!res.success) {
        return { success: false, message: res.message };
    }
    return { success: true, data: res.data };
}

export async function updateApplicationStatus(
    applicationId: string,
    status: 'ACCEPTED' | 'REJECTED' | 'PENDING' | 'REVIEWING'
): Promise<ActionResponse> {
    const auth = await requireEmployer();
    if (auth.error) {
        return { success: false, message: "Bạn không có quyền thực hiện thao tác này" };
    }
    const res = await CandidateBookmark.updateStatus(auth.company.id, auth.payload.id, applicationId, status);
    if (!res.success) {
        return { success: false, message: res.message };
    }
    return { success: true, data: res.data };
}