import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
    const cookie = request.cookies.get("token");
    if (!cookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(cookie?.value);

    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
        title,
        description,
        requirements,
        benefits,
        quantity,
        salaryMin,
        salaryMax,
        wardId,
        addressDetail,
        type,
        experience,
        level,
        deadline,
        categoryId,
        status: jobStatus,
        quizId,
        latitude,
        longitude,
    } = body;

    if (!title?.trim() || !description?.trim() || !categoryId) {
        return NextResponse.json({ error: "Vui lòng điền đầy đủ tiêu đề, mô tả và ngành nghề" }, { status: 400 });
    }

    try {
        let slug = title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
        slug = `${slug}-${Date.now()}`;

        const job = await prisma.job.create({
            data: {
                title: title.trim(),
                slug,
                description: description.trim(),
                requirements: requirements || null,
                benefits: benefits || null,
                quantity: quantity ? Number(quantity) : 1,
                salaryMin: salaryMin ? Number(salaryMin) : null,
                salaryMax: salaryMax ? Number(salaryMax) : null,
                wardId: wardId || null,
                addressDetail: addressDetail || null,
                type: type || "FULL_TIME",
                experience: experience || null,
                level: level || null,
                deadline: deadline ? new Date(deadline) : null,
                categoryId,
                userId: (payload as any).userId || (payload as any).id,
                quizId: quizId || null,
                latitude: latitude ? Number(latitude) : null,
                longitude: longitude ? Number(longitude) : null,
                jobflash: true,
                status: jobStatus || "ACTIVE",
            },
        });

        return NextResponse.json({ success: true, job }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Lỗi server" }, { status: 500 });
    }
};