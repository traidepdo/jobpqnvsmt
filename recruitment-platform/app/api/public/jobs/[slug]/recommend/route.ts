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
            select: { id: true }
        });

        if (!job) {
            return NextResponse.json({ error: "Không tìm thấy công việc gốc" }, { status: 404 });
        }

        // 2. Query Django recommender API
        const response = await fetch(`http://127.0.0.1:8000/api/jobs/${job.id}/recommend/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            next: { revalidate: 60 } // Cache recommendations for 60s
        });

        if (!response.ok) {
            throw new Error("Không thể kết nối đến Django Recommender API");
        }

        const data = await response.json();
        const recommendations = data.recommendations || [];
        const recommendedIds = recommendations.map((r: any) => r.id);

        if (recommendedIds.length === 0) {
            return NextResponse.json([], { status: 200 });
        }

        // 3. Query rich details from Prisma for these IDs
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
