import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const job = await prisma.job.findUnique({
        where: { slug },
        select: {
            title: true,
            company: { select: { name: true } },
            ward: { select: { name: true } }
        }
    });
    if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const title = `${job.title} - ${job.company.name} | Phú Quốc Jobs`;
    const description = `${job.title} tuyển dụng tại ${job.company.name} (${job.ward?.name || 'Phú Quốc'}). Mức lương hấp dẫn, môi trường làm việc chuyên nghiệp. Nộp hồ sơ ứng tuyển ngay!`;

    return NextResponse.json({ title, description });
}