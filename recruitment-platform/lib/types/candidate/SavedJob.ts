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