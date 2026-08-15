export interface Job {
    id: string;
    title: string;
    slug: string;
    salaryMin: number | null;
    salaryMax: number | null;
    type: string;
    experience: string | null;
    level: string | null;
    deadline: Date | string | null;
    createdAt: Date | string;
    categoryId: string;
    wardId: string | null;
    jobflash?: boolean;
    company: {
        id: string;
        name: string;
        logo: string | null;
        slug: string;
    };
    category: {
        name: string;
        slug: string;
    };
    ward: {
        name: string;
    } | null;
    salaryStatus?: 'good' | 'average' | 'bad' | null;
    salaryDiff?: number;
}
export interface MatchedCompany {
    id: string;
    name: string;
    logo: string | null;
    industry: string | null;
    slug: string;
    _count: { jobs: number };
}