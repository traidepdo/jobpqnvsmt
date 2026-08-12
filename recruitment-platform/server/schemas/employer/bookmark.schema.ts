import z from 'zod';
export const bookmarkSchema = z.object({
    id: z.string().min(1, "ID is required"),
    applicationId: z.string().min(1, "Application ID is required"),
});