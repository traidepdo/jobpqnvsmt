export interface Application {
    id: string;
    status: string;
    coverLetter: string | null;
    createdAt: string;
    job: {
        id: string;
        title: string;
        slug: string;
        salaryMin: number | null;
        salaryMax: number | null;
        company: { name: string; logo: string | null };
        category: { name: string };
    };
    resume: { id: string; title: string } | null;
}