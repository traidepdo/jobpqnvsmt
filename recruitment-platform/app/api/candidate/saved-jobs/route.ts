import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCandidate } from '@/lib/requireCandidate';

export async function GET() {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  const saved = await prisma.savedJob.findMany({
    where: { userId: auth.payload.id },
    orderBy: { createdAt: 'desc' },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          slug: true,
          salaryMin: true,
          salaryMax: true,
          type: true,
          deadline: true,
          status: true,
          company: { select: { name: true, logo: true } },
          category: { select: { name: true } },
          ward: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({ savedJobs: saved });
}

export async function POST(req: Request) {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  try {
    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: 'Thiếu jobId' }, { status: 400 });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: 'Không tìm thấy việc làm' }, { status: 404 });
    }

    const saved = await prisma.savedJob.upsert({
      where: { userId_jobId: { userId: auth.payload.id, jobId } },
      create: { userId: auth.payload.id, jobId },
      update: {},
    });

    return NextResponse.json({ saved }, { status: 201 });
  } catch (error) {
    console.error('Save job error:', error);
    return NextResponse.json({ error: 'Không thể lưu việc làm' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ error: 'Thiếu jobId' }, { status: 400 });
  }

  await prisma.savedJob.deleteMany({
    where: { userId: auth.payload.id, jobId },
  });

  return NextResponse.json({ success: true });
}
