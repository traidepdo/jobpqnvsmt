import { z } from "zod";

export const ExperienceItemSchema = z.object({
    company: z.string().min(1, "Tên công ty không được để trống"),
    position: z.string().min(1, "Vị trí không được để trống"),
    duration: z.string().min(1, "Thời gian không được để trống"),
    description: z.string().optional().default(""),
});

export const UpdateCandidateProfileSchema = z.object({
    name: z.string().min(1, "Họ và tên không được để trống"),
    phone: z.string().min(1, "Số điện thoại không được để trống"),
    profileSummary: z.string().optional().default(""),
    profileExperience: z.array(ExperienceItemSchema).optional().default([]),

});

export type ExperienceItemInput = z.infer<typeof ExperienceItemSchema>;
export type UpdateCandidateProfileInput = z.infer<typeof UpdateCandidateProfileSchema>;
