// app/api/employer/candidates/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';

import { signCloudinaryCvUrl } from '@/lib/cloudinarySign';

export async function GET(req: Request) {
    const auth = await requireEmployer();
    if (auth.error) return auth.error;

    const applications = await prisma.application.findMany({
        where: {
            job: {
                companyId: auth.company.id,
            },
            isBookmarked: true, // 🌟 Chỉ lấy những hồ sơ ứng viên được lưu trữ tiềm năng
        },
        include: {
            job: {
                select: {
                    id: true,
                    title: true,
                }
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatar: true,
                }
            },
            // 🌟 BỔ SUNG QUAN HỆ RESUME GIỐNG BÊN KIA ĐỂ LẤY HỌC VẤN / KINH NGHIỆM
            resume: {
                select: {
                    id: true,
                    title: true,
                    summary: true,
                    address: true,
                    education: true,
                    experience: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const signedApplications = applications.map(app => ({
        ...app,
        cvUrl: signCloudinaryCvUrl(app.cvUrl)
    }));

    return NextResponse.json(signedApplications);
}