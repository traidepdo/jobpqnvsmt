import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyToken } from './auth';
import { prisma } from './prisma';

export async function requireAdmin() {
    const token = (await cookies()).get('token')?.value;
    if (!token) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
        return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }

    // Check if admin user still exists in database
    const user = await prisma.user.findUnique({
        where: { id: payload.id as string }
    });
    if (!user) {
        return { error: NextResponse.json({ error: 'User session invalid' }, { status: 401 }) };
    }
    if (!user.isActive || user.isLocked) {
        return { error: NextResponse.json({ error: 'Tài khoản đã bị khóa hoặc ngừng hoạt động' }, { status: 401 }) };
    }

    return { payload };
}