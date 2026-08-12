export interface CategorySEO {
    id: string;
    name: string;
    slug: string;
    description?: string;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
    excerpt: string;
    createdAt: string;
    author?: { name: string; avatar: string };
    tags?: { name: string; slug: string }[];
}

export interface PaginationData {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrevious: boolean;
    totalPages: number;
}