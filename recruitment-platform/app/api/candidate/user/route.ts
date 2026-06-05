import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCandidate } from '@/lib/requireCandidate';
import { writeFile, mkdir } from 'fs/promises';

export async function GET() {
    const auth = await requireCandidate();
    if (auth.error) return auth.error;

    const user = await prisma.user.findUnique({
        where: { id: auth.payload.id },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            avatar: true,
        },
    });

    return NextResponse.json({ user });
}
