import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-123');

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
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