export interface FollowedCompanyItem {
    id: string;
    createdAt: string | Date;
    company: {
        id: string;
        name: string;
        logo: string | null;
        description: string | null;
        coverImage?: string | null;
        slug: string;
    };
}