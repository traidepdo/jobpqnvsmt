import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { companyPublicSelect } from "@/lib/prismaSafe";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        // 1. Find the target job ID
        const job = await prisma.job.findUnique({
            where: { slug },
            select: { id: true, categoryId: true }
        });

        if (!job) {
            return NextResponse.json({ error: "Không tìm thấy công việc gốc" }, { status: 404 });
        }

        let recommendedIds: string[] = [];

        // lấy gợi ý từ django
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            const response = await fetch(`http://127.0.0.1:8000/api/jobs/${job.id}/recommend/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.INTERNAL_API_KEY || ""}`,
                },
                signal: controller.signal,
                next: { revalidate: 60 } // Cache recommendations for 60s
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                const recommendations = data.recommendations || [];
                recommendedIds = recommendations.map((r: any) => r.id);
            }
        } catch (fetchError) {
            console.error("Django Recommender API error:", fetchError);
            console.warn("Django Recommender API is offline or timed out. Falling back to DB-based recommendation.");
        }

        // 3. Fallback: Query jobs in the same category if Django recommendations are empty or service is offline
        // lấy gợi ý từ db nếu django không trả về được gì
        if (recommendedIds.length === 0) {
            const fallbackJobs = await prisma.job.findMany({
                where: {
                    categoryId: job.categoryId,
                    id: { not: job.id },
                    isVisible: true
                },
                take: 4,
                include: {
                    company: { select: companyPublicSelect },
                    category: { select: { name: true } },
                    ward: { select: { name: true } }
                }
            });
            return NextResponse.json(fallbackJobs, { status: 200 });
        }

        // lấy thông tin chi tiết các jobs từ recommendedIds
        const relatedJobs = await prisma.job.findMany({
            where: {
                id: { in: recommendedIds },
                isVisible: true
            },
            include: {
                company: { select: companyPublicSelect },
                category: { select: { name: true } },
                ward: { select: { name: true } }
            }
        });

        // Sort them to preserve the similarity order returned by Django
        const sortedJobs = recommendedIds
            .map((id: string) => relatedJobs.find((j: any) => j.id === id))
            .filter(Boolean);

        return NextResponse.json(sortedJobs, { status: 200 });

    } catch (error) {
        console.error("Error in recommendation proxy route:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
