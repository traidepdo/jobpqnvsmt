import { z } from "zod";

export const createApplicationSchema = z.object({
    userId: z.string(),
    jobId: z.string(),
    resumeId: z.string().nullable().optional(),
    cvUrl: z.string().nullable().optional(),
    coverLetter: z.string().nullable().optional(),
    quizAnswers: z.array(z.object({
        questionId: z.string(),
        selectedOption: z.number(),
    })).nullable().optional(),
    quizDuration: z.number().nullable().optional(),
});

export interface CreateApplicationParams extends z.infer<typeof createApplicationSchema> { }

