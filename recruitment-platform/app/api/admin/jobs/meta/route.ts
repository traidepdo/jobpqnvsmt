import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const [categories, companies, wards] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.company.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.ward.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, district: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({ categories, companies, wards });
}
