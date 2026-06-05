import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { companyPublicSelect, fixInvalidCompanySize } from "@/lib/prismaSafe";



export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        await fixInvalidCompanySize(prisma);
        const { slug } = await params;
        const job = await prisma.job.findUnique({
            where: { slug },
            include: {
                company: { select: companyPublicSelect },
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
        });

        if (!job) {
            return NextResponse.json({ error: "Không tìm thấy công việc" }, { status: 404 });
        }

        return NextResponse.json(job, { status: 200 });
    } catch (error) {
        console.error("Error fetching job details:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
