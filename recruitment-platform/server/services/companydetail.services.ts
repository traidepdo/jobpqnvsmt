import { prisma } from "@/lib/prisma";
import type { ICompanyDetail } from "@/lib/types/companydetail";
import { requireCandidate } from "@/lib/requireCandidate";
import { cookies } from "next/headers";
import { verifyToken } from '@/lib/auth';
export async function getCompanyDetail(slug: string): Promise<ICompanyDetail | null> {
    const company = await prisma.company.findUnique({
        where: { slug: slug, isApproved: true, isActive: true },
        include: {
            ward: {
                include: {
                    district: {
                        include: {
                            province: true
                        }
                    }
                }
            },
            jobs: {
                where: { status: { in: ["ACTIVE", "CLOSED"] } },
                orderBy: { createdAt: "desc" },
                include: {
                    category: {
                        select: { name: true }
                    },
                    ward: {
                        select: { name: true }
                    }
                }
            }
        }
    });
    if (!company) {
        return null;
    }
    const result: ICompanyDetail = {
        id: company.id,
        name: company.name,
        slug: company.slug,
        description: company.description || '',
        website: company.website || '',
        size: company.size || '',
        addressDetail: company.addressDetail || '',
        logo: company.logo || '',
        coverImage: company.coverImage || '',
        images: company.images as string[] || [],
        industry: company.industry || '',
        ward: {
            id: company.ward?.id || '',
            name: company.ward?.name || '',
            district: {
                id: company.ward?.district?.id || '',
                name: company.ward?.district?.name || '',
                province: {
                    id: company.ward?.district?.province?.id || '',
                    name: company.ward?.district?.province?.name || '',
                }
            }
        },
        jobs: company.jobs.map((job) => ({
            id: job.id,
            title: job.title,
            slug: job.slug,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            experience: job.experience,
            type: job.type,
            status: job.status,
            deadline: job.deadline,
            category: {
                name: job.category?.name || '',
            },
            ward: job.ward ? { name: job.ward.name } : undefined
        }))
    };
    return result;
}

export async function authFlow(companyId: string) {
    let initialFollowed = false;
    let isLoggedIn = false;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
        try {
            const payload = await verifyToken(token);
            if (payload) {
                isLoggedIn = true;
                const existing = await prisma.savedCompany.findUnique({
                    where: { userId_companyId: { userId: payload.id as string, companyId: companyId } }
                });
                initialFollowed = !!existing;
            }
        } catch (err) {
            console.error("Error verifying token in Server Component:", err);
        }
    }
    return { isLoggedIn, initialFollowed };
}