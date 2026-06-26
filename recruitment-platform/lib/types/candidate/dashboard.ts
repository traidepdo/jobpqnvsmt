export interface Stats {
    applications: number;
    savedJobs: number;
    resumes: number;
    pending: number;
    reviewing: number;
    accepted: number;
}

export interface Application {
    id: string;
    status: string;
    createdAt: string;
    job: {
        title: string;
        slug: string;
        company: { name: string; logo: string | null };
    };
}