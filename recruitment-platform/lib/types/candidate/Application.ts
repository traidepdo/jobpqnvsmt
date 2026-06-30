export interface Application {
    id: string;
    status: string;
    coverLetter: string | null;
    createdAt: string;
    cvUrl: string;
    job: {
        id: string;
        title: string;
        slug: string;
        salaryMin: number | null;
        salaryMax: number | null;
        type: string;
        deadline: string | null;
        company: { name: string; logo: string | null };
        category: { name: string };
        ward: { name: string } | null;
    };
    resume: { id: string; title: string } | null;
}