export interface Job {
    id: string;
    title: string;
    slug: string;
    status: string;
    salaryMin: number | null;
    salaryMax: number | null;
    deadline: string | null;
    category: { name: string };
    ward: { name: string } | null;
    _count: { applications: number };
    isVisible: boolean;
    rejectReason?: string | null;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export type FilterTab = { label: string; status?: string; isVisible?: string };
