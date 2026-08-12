import { z } from "zod";
export const SaveJobSchema = z.object({
    userId: z.string(),
    jobId: z.string(),
});
export type SaveJobInput = z.infer<typeof SaveJobSchema>;