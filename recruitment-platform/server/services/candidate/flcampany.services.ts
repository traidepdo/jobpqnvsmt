import { prisma } from "@/lib/prisma";
import { FollowedCompanyItem } from "@/lib/types/candidate/FollowCompany";


export const folowCampany = {

    async get(userId: string): Promise<FollowedCompanyItem[]> {
        try {
            const result = await prisma.savedCompany.findMany({
                where: {
                    userId: userId
                },
                select: {
                    company: true,
                    createdAt: true,
                    id: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return result as FollowedCompanyItem[];
        } catch (error) {
            console.error("Error getting followed companies:", error);
            return [];
        }
    },

    async delete(userId: string, companyId: string) {
        try {
            await prisma.savedCompany.delete({
                where: {
                    userId_companyId: {
                        userId: userId,
                        companyId: companyId
                    }
                }
            });
            return {
                success: true,
                message: "Bỏ theo dõi công ty thành công"
            };
        } catch (error) {
            console.error("Error deleting followed company:", error);
            return {
                success: false,
                message: "Bỏ theo dõi thất bại"
            };
        }
    },

    async add(userId: string, companyId: string) {
        try {
            await prisma.savedCompany.create({
                data: {
                    userId: userId,
                    companyId: companyId
                }
            });
            return {
                success: true,
                message: "Theo dõi công ty thành công"
            };
        } catch (error) {
            console.error("Error adding followed company:", error);
            return {
                success: false,
                message: "Theo dõi thất bại"
            };
        }
    }

}