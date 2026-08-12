import z from "zod";

export const queryCompany = z.object({
    industry: z.string().optional(),
    search: z.string().optional(),
    page: z.number().optional(),
    limit: z.number().optional().default(9),
});
export type QueryCompany = z.infer<typeof queryCompany>;