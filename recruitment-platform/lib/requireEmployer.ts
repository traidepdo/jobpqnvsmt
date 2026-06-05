import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyToken } from './auth';
import { prisma } from './prisma';

export async function requireEmployer() {
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'EMPLOYER') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id as string }
  });
  if (!user) {
    return { error: NextResponse.json({ error: 'User session invalid' }, { status: 401 }) };
  }
  if (!user.isActive || user.isLocked) {
    return { error: NextResponse.json({ error: 'Tài khoản đã bị khóa hoặc ngừng hoạt động' }, { status: 401 }) };
  }

  const company = await prisma.company.findUnique({
    where: { ownerId: payload.id },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      website: true,
      description: true,
      industry: true,
      addressDetail: true,
      wardId: true,
      isApproved: true,
      isActive: true,
      ward: { select: { id: true, name: true } },
    },
  });

  if (!company) {
    return { error: NextResponse.json({ error: 'Chưa có hồ sơ công ty' }, { status: 404 }) };
  }

  return { payload, company };
}
