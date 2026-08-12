export interface ICompanyDetail {
    id: string;
    name: string;
    slug: string;
    description: string;
    website: string;
    size: string;
    addressDetail: string;
    logo: string;
    coverImage: string;
    images: string[];
    industry: string;

    ward: {
        id: string;
        name: string;
        district: {
            id: string;
            name: string;
            province: {
                id: string;
                name: string;
            };
        };
    };
    jobs: JobItem[];
}

export interface JobItem {
    id: string;
    title: string;
    slug: string;
    salaryMin: number | null;
    salaryMax: number | null;
    experience: string | null;
    deadline: Date | string | null;
    category: {
        name: string;
    };
}