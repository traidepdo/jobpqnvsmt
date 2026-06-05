import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-123');

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ user: null }); // trả null thay vì 401 để Header không bị lỗi
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: payload.id as string },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                phone: true,
                isActive: true,
                createdAt: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                        logo: true,
                        isApproved: true,
                        isActive: true,
                    },
                },
            },
        });

        if (!user) return NextResponse.json({ user: null });

        return NextResponse.json({ user });
    } catch {
        return NextResponse.json({ user: null });
    }
}