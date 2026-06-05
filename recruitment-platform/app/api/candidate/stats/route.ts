import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCandidate } from '@/lib/requireCandidate';

export async function GET() {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  const userId = auth.payload.id;

  const [applications, savedJobs, resumes, pending, reviewing, accepted] = await Promise.all([
    prisma.application.count({ where: { userId } }),
    prisma.savedJob.count({ where: { userId } }),
    prisma.resume.count({ where: { userId } }),
    prisma.application.count({ where: { userId, status: 'PENDING' } }),
    prisma.application.count({ where: { userId, status: 'REVIEWING' } }),
    prisma.application.count({ where: { userId, status: 'ACCEPTED' } }),
  ]);

  return NextResponse.json({
    applications,
    savedJobs,
    resumes,
    pending,
    reviewing,
    accepted,
  });
}
