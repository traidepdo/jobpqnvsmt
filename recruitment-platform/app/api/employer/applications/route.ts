// app/api/employer/applications/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';
import { ApplicationStatus } from '@prisma/client';

import { signCloudinaryCvUrl } from '@/lib/cloudinarySign';

export async function GET(req: Request) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as ApplicationStatus | null;
  const jobId = searchParams.get('jobId');
  const categoryId = searchParams.get('categoryId');

  const applications = await prisma.application.findMany({
    where: {
      job: {
        companyId: auth.company.id,
        ...(categoryId ? { categoryId } : {}),
      },
      ...(status ? { status } : {}),
      ...(jobId ? { jobId } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          slug: true,
          category: {
            select: {
              id: true,
              name: true,
            }
          }
        },
      },
      // 🌟 BỔ SUNG THÊM QUAN HỆ RESUME Ở ĐÂY 🌟
      resume: {
        select: {
          id: true,
          title: true,
          summary: true,
          address: true,
          education: true,   // Lấy dữ liệu học vấn JSON
          experience: true,  // Lấy dữ liệu kinh nghiệm JSON
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const signedApplications = applications.map(app => ({
    ...app,
    cvUrl: signCloudinaryCvUrl(app.cvUrl)
  }));

  return NextResponse.json({ applications: signedApplications });
}