import { prisma } from "@/lib/prisma";
import { FollowedCompanyItem } from "@/lib/types/candidate/FollowCompany";


export async function unfollowCompany(companyId: string) {
    try {
        const res = await fetch(`/api/candidate/follow-employer?companyId=${companyId}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            return { success: true };
        } else {
            const err = await res.json().catch(() => ({}));
            return { error: err.error || 'Không thể bỏ theo dõi. Vui lòng thử lại.' };
        }
    } catch (e) {
        console.error(e);
        return { error: 'Đã xảy ra lỗi khi bỏ theo dõi.' };
    }
}


export async function getFollowCompany(id: string): Promise<FollowedCompanyItem[]> {
    try {
        const data = await prisma.savedCompany.findMany({
            where: { userId: id },
            select: {
                id: true,
                createdAt: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                        logo: true,
                        description: true,
                        coverImage: true,
                        slug: true,
                    },
                },
            },
        });
        return data as FollowedCompanyItem[];
    } catch (e) {
        console.error("Lỗi getFollowCompany:", e);
        return [];
    }
}