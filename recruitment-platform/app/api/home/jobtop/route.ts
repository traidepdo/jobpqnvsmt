import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { companyCardSelect } from "@/lib/prismaSafe";
import { getLatestModel, predictSalary } from "@/lib/salaryPredictor";

export async function GET() {

    try {
        const now = new Date();
        const countapplicate = await prisma.application.groupBy({
            by: ["jobId"],
            _count: {
                jobId: true,
            },
            orderBy: {
                _count: {
                    jobId: "desc",
                },
            },
            take: 4,
            where: {
                job: {
                    status: "ACTIVE",
                    OR: [
                        { deadline: null },
                        { deadline: { gte: now } }
                    ]
                }
            }
        })

        let jobIds = countapplicate
            .map((item) => item.jobId);

        const remainingJobs = await prisma.job.findMany({
            where: {
                status: "ACTIVE",
                id: {
                    in: jobIds
                },
                OR: [
                    { deadline: null },
                    { deadline: { gte: now } }
                ]
            },
            include: {
                company: { select: companyCardSelect },
                category: {
                    select: {
                        name: true,
                        slug: true,
                    }
                },
                ward: {
                    select: {
                        name: true,
                        slug: true,
                    }
                }
            }
        })

        const model = await getLatestModel();
        const jobPredictedTop = remainingJobs.map(job => {
            const min = job.salaryMin;
            const max = job.salaryMax;

            let actualSalary: number | null = null;
            if (min !== null && max !== null) {
                actualSalary = (min + max) / 2;
            } else if (min !== null) {
                actualSalary = min;
            } else if (max !== null) {
                actualSalary = max;
            }
            let salaryStatus: 'good' | 'average' | 'bad' | null = null;
            let salaryDiff = 0;

            if (actualSalary !== null) {
                if (actualSalary > 100000) {
                    actualSalary = actualSalary / 1000000;
                }

                const predicted = predictSalary({
                    experience: job.experience,
                    level: job.level,
                    type: job.type,
                    categoryId: job.categoryId,
                    wardId: job.wardId,
                }, model);

                salaryDiff = Math.round(((actualSalary - predicted) / predicted) * 100);
                if (actualSalary >= 1.15 * predicted) {
                    salaryStatus = 'good';
                } else if (actualSalary < 0.9 * predicted) {
                    salaryStatus = 'bad';
                } else {
                    salaryStatus = 'average';
                }
            }
            return {
                ...job,
                salaryStatus,
                salaryDiff
            };
        })

        return NextResponse.json({ jobTop: jobPredictedTop });

    } catch (error) {
        console.error("Error fetching featured jobs:", error);
        return NextResponse.json({ jobTop: [] });
    }
}

