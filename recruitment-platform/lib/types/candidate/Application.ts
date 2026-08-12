import { z } from "zod";
import { createApplicationSchema } from "@/server/schemas/candidate/application.schema";

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;


export interface Application {
    id: string;
    userId: string;
    jobId: string;
    resumeId: string | null;
    cvUrl?: string | null;
    coverLetter: string | null;
    status: string;
    quizScore?: number | null;
    quizDuration?: number | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    job: {
        id: string;
        title: string;
        slug: string;
        salaryMin: number | null;
        salaryMax: number | null;
        company: {
            name: string;
            logo: string | null;
        } | null;
        category: {
            name: string;
        };
    };
    resume: {
        id: string;
        title: string;
    } | null;
}