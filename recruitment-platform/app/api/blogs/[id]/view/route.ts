import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'Blog ID is required' }, { status: 400 });
        }

        const updatedBlog = await prisma.blog.update({
            where: { id },
            data: { views: { increment: 1 } },
            select: { id: true, views: true },
        });

        return NextResponse.json({ success: true, views: updatedBlog.views });
    } catch (error) {
        console.error('Error incrementing blog view:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
