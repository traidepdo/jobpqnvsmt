import { prisma } from "@/lib/prisma";
import { SavedItem } from "@/lib/types/candidate/SavedJob";
export async function createSavedJob(id: string) {
    const data = await prisma.savedJob.findMany({
        where: {
            userId: id
        },
        include: {
            job: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    salaryMin: true,
                    salaryMax: true,
                    type: true,
                    deadline: true,
                    company: {
                        select: {
                            name: true,
                            logo: true
                        }
                    },
                    category: {
                        select: {
                            name: true
                        }
                    },
                    ward: {
                        select: {
                            name: true
                        }
                    }
                }
            },
        },

    })
    return data as unknown as SavedItem[];

}