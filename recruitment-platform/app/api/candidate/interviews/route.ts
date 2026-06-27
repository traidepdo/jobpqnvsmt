import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = payload.id as string;

    const interviews = await prisma.interview.findMany({
        where: { application: { userId } },
        include: {
            application: {
                include: {
                    job: {
                        include: {
                            company: { select: { id: true, name: true, logo: true } },
                        },
                    },
                },
            },
        },
        orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({ interviews });
}