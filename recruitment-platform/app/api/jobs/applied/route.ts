import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCandidate } from '@/lib/requireCandidate';

export async function GET() {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  try {
    const applications = await prisma.application.findMany({
      where: { userId: auth.payload.id },
      include: {
        job: {
          include: {
            company: {
              select: {
                name: true,
                logo: true,
                slug: true,
              }
            },
            category: {
              select: {
                name: true,
                slug: true,
              }
            },
            ward: {
              select: {
                name: true,
              }
            },
          }
        }
      }
    });

    const jobs = applications.map(app => app.job).filter(Boolean);
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching applied jobs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
