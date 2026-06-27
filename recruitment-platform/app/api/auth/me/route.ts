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
                isLocked: true,
                tokenVersion: true,
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

        if (!user || !user.isActive || user.isLocked) {
            const response = NextResponse.json({ user: null });
            response.cookies.delete('token');
            return response;
        }

        // Check tokenVersion to kick out old sessions
        const jwtPayload = payload as any;
        if (jwtPayload.tokenVersion !== undefined && user.tokenVersion !== jwtPayload.tokenVersion) {
            const response = NextResponse.json({ user: null });
            response.cookies.delete('token');
            return response;
        }

        return NextResponse.json({ user });
    } catch {
        const response = NextResponse.json({ user: null });
        response.cookies.delete('token');
        return response;
    }
}