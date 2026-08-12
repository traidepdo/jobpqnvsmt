import { ExperienceItemInput, UpdateCandidateProfileInput } from "@/server/schemas/candidate/user.schema";

export type ExperienceItem = ExperienceItemInput;

export interface User {
    id: string;
    email: string;
    name: string;
    phone: string;
    avatar: string | null;
    profileSummary?: string;
    profileExperience?: ExperienceItem[];
}

export type { ExperienceItemInput, UpdateCandidateProfileInput };
