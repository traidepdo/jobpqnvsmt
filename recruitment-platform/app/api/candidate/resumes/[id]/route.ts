import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCandidate } from '@/lib/requireCandidate';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  const { id } = await params;

  const existing = await prisma.resume.findFirst({
    where: { id, userId: auth.payload.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Không tìm thấy CV' }, { status: 404 });
  }

  await prisma.resume.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
