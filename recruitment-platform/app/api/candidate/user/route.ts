import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCandidate } from '@/lib/requireCandidate';

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

    if (!user) {
        return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    const defaultResume = await prisma.resume.findFirst({
        where: { userId: auth.payload.id, isDefault: true },
        select: {
            profileSummary: true,
            profileExperience: true,
        },
    }) || await prisma.resume.findFirst({
        where: { userId: auth.payload.id },
        orderBy: { updatedAt: 'desc' },
        select: {
            profileSummary: true,
            profileExperience: true,
        },
    });

    return NextResponse.json({
        user: {
            ...user,
            profileSummary: defaultResume?.profileSummary || '',
            profileExperience: defaultResume?.profileExperience || [],
        }
    });
}

export async function PUT(req: Request) {
    const auth = await requireCandidate();
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        const { name, phone, profileSummary, profileExperience } = body;

        // Update basic user info
        const updatedUser = await prisma.user.update({
            where: { id: auth.payload.id },
            data: {
                name: name ? name.trim() : undefined,
                phone: phone ? phone.trim() : undefined,
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                avatar: true,
            }
        });

        // Find or create candidate default resume
        let resume = await prisma.resume.findFirst({
            where: { userId: auth.payload.id, isDefault: true },
        }) || await prisma.resume.findFirst({
            where: { userId: auth.payload.id },
            orderBy: { updatedAt: 'desc' },
        });

        if (resume) {
            resume = await prisma.resume.update({
                where: { id: resume.id },
                data: {
                    profileSummary: profileSummary !== undefined ? profileSummary : undefined,
                    profileExperience: profileExperience !== undefined ? profileExperience : undefined,
                    isProfile: true,
                }
            });
        } else {
            resume = await prisma.resume.create({
                data: {
                    userId: auth.payload.id,
                    title: 'Hồ sơ của tôi',
                    isDefault: true,
                    profileSummary: profileSummary || null,
                    profileExperience: profileExperience || [],
                    isProfile: true,
                }
            });
        }

        return NextResponse.json({
            success: true,
            user: {
                ...updatedUser,
                profileSummary: resume.profileSummary || '',
                profileExperience: resume.profileExperience || [],
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Không thể cập nhật thông tin cá nhân' }, { status: 500 });
    }
}
