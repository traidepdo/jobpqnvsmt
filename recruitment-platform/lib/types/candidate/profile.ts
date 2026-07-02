export interface ExperienceItem {
    company: string;
    position: string;
    duration: string;
    description: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    phone: string;
    avatar: string | null;
    profileSummary?: string;
    profileExperience?: ExperienceItem[];
}