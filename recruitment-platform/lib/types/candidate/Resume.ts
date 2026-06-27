export interface Resume {
    id: string;
    title: string;
    isDefault: boolean;
    address: string | null;
    summary: string | null;
    createdAt: string;
    updatedAt: string;
    template: { id: string; name: string; slug: string; thumbnailUrl: string | null } | null;
    _count: { applications: number };
}