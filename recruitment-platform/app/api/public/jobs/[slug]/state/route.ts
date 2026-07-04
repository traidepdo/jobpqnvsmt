import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCandidate } from "@/lib/requireCandidate";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const user = await requireCandidate();
    if (!user || !user.payload?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const useID: string = user.payload.id;

    const targetJob = await prisma.job.findUnique({
        where: { slug },
        select: { id: true }
    });

    if (!targetJob) {
        return NextResponse.json({ error: "Không tìm thấy công việc" }, { status: 404 });
    }

    const [resumes, savedJobRecord, candidateApps] = await Promise.all([
        prisma.resume.findMany({
            where: { userId: useID, isProfile: false },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                isDefault: true,
            }
        }),
        prisma.savedJob.findUnique({
            where: { userId_jobId: { userId: useID, jobId: targetJob.id } }
        }),
        prisma.application.findMany({
            where: { userId: useID },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                jobId: true,
                status: true,
            }
        })
    ]);

    return NextResponse.json({
        resumes,
        user: user.payload,
        isAuthenticated: true,
        savedJobRecord,
        applications: candidateApps,
    });
}