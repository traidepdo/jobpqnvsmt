'use server';

import { ActionResponse } from "@/types/action.type";
import { getUserID } from '@/server/actions/employer/userID.action';
import { EmployerApplicationSchema } from '@/server/schemas/employer/application.schema';
import { ApplicationService } from '@/server/services/employer/application.services';
import { ApplicationParams } from '@/lib/types/employer/application';

export async function getApplication(
    arg1?: ApplicationParams | ActionResponse | null,
    arg2?: ApplicationParams
): Promise<ActionResponse> {
    const id = await getUserID();

    if (!id.success) {
        return { success: false, message: "User not found" };
    }

    let params: ApplicationParams = {};
    if (arg2) {
        params = arg2;
    } else if (arg1 && typeof arg1 === 'object' && !('success' in arg1)) {
        params = arg1 as ApplicationParams;
    }

    const valid = EmployerApplicationSchema.parse(params || {});
    const data = await ApplicationService.getAllApplications(id.data!, valid);
    return {
        success: true,
        message: "Application fetched successfully",
        data: data
    };
}