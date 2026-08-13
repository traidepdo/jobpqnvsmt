'use server';

import { JobsDetailSchema } from '@/server/schemas/jobs/details.schema';
import { jobsDetailService } from '@/server/services/jobs/detail.services';
import { ActionResponse } from "@/types/action.type";

export const getJobDetail = async (params: Promise<{ slug: string }>): Promise<ActionResponse> => {
    try {
        const { slug } = await params;
        const valid = JobsDetailSchema.safeParse({ slug });

        if (!valid.success) {
            return { success: false, message: valid.error.message };
        }
        const data = await jobsDetailService.getJobDetail(valid.data.slug);
        return { success: true, message: "Job fetched successfully", data };
    } catch (error) {
        return { success: false, message: "Failed to fetch job" };
    }
};
