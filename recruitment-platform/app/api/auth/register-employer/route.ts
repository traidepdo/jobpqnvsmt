import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        + '-' + Date.now();
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            name, email, password,
            companyName, companyWebsite,
            companyDescription, companySize, industry,
        } = body;

        if (!name || !email || !password || !companyName) {
            return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'EMPLOYER',
            },
        });
        const company = await prisma.company.create({
            data: {
                name: companyName,
                slug: slugify(companyName),
                website: companyWebsite || null,
                description: companyDescription || null,
                size: companySize && ['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'].includes(companySize)
                    ? companySize
                    : null,
                industry: industry || null,
                ownerId: newUser.id,
                isApproved: false,
            },
        });
        const user = newUser;

        // Gửi thông báo cho Admin
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true }
        });
        if (admins.length > 0) {
            await prisma.notification.createMany({
                data: admins.map(admin => ({
                    userId: admin.id,
                    type: 'SYSTEM',
                    title: 'Doanh nghiệp đăng ký mới',
                    content: `Doanh nghiệp "${companyName}" đăng ký tài khoản nhà tuyển dụng mới (đại diện: ${name}) và đang chờ phê duyệt.`,
                    refId: company.id,
                }))
            });
        }

        return NextResponse.json(
            { message: 'Đăng ký doanh nghiệp thành công! Vui lòng chờ admin duyệt.', user },
            { status: 201 }
        );
    } catch (error) {
        console.error('Register employer error:', error);
        return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
    }
}
