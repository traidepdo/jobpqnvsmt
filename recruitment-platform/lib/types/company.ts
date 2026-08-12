import { QueryCompany as IQueryCompanyZod } from "@/server/schemas/company.schema";
import { Ward, District, Province, CompanySize } from "@prisma/client";

// Mở rộng kiểu Ward để khớp với query include từ Prisma
export type WardWithRelations = Ward & {
    district?: (District & {
        province?: Province | null;
    }) | null;
};

export interface ItemCompany {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    addressDetail?: string | null;
    website?: string | null;
    logo?: string | null;
    coverImage?: string | null;
    industry?: string | null;
    size?: CompanySize | string | null; // Hỗ trợ cả Enum của Prisma lẫn string
    wardId?: string | null;
    ownerId?: string | null;
    isApproved?: boolean;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;

    // Số lượng jobs từ _count
    _count?: {
        jobs: number;
    };

    // Các thông tin địa giới hành chính (cả phẳng lẫn lồng nhau)
    ward?: WardWithRelations | null;
    district?: District | null;
    province?: Province | null;
}

export interface IQueryCompany extends IQueryCompanyZod { }