import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';

export async function GET() {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const [categories, wards] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true } }),
    prisma.ward.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, district: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({ categories, wards });
}
