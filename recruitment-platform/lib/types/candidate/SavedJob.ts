import { SaveJobInput } from "@/server/schemas/candidate/savejob.schema"
export interface SavedItem {
    id: string;
    createdAt: string;
    job: {
        id: string;
        title: string;
        slug: string;
        salaryMin: number | null;
        salaryMax: number | null;
        type: string;
        deadline: string | null;
        createdAt: string | Date;
        company: { name: string; logo: string | null };
        category: { name: string };
        ward: { name: string } | null;
    };
}
export interface Query {
    page?: number;
    limit?: number;
    query?: string;
}
export interface SavedJobsResponse {
    items: SavedItem[];
    total: number;
}
export type { SaveJobInput }