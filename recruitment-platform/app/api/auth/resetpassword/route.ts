import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcrypt";
import { any, z } from "zod";
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { pass, passnew, confirm_pass } = body
    const cookieStore = cookies()
    const token = (await cookieStore).get('token')?.value
    if (!token) return NextResponse.json({ message: 'No token' }, { status: 401 })
    if (!pass) return NextResponse.json({ message: 'Chưa nhập pass' }, { status: 400 })
    if (!passnew) return NextResponse.json({ message: 'Chưa nhập passnew' }, { status: 400 })
    if (!confirm_pass) return NextResponse.json({ message: 'Chưa nhập confirm_pass' }, { status: 400 })
    if (passnew !== confirm_pass) return NextResponse.json({ message: 'passnew and confirm_pass are not equal' }, { status: 400 })

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ message: 'Không hợp lệ hoặc phiên làm việc hết hạn' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: payload.id as string } })
    if (!user) return NextResponse.json({ message: 'Không tìm thấy user' }, { status: 404 })

    const isMatch = await compare(pass, user.password);
    if (!isMatch) return NextResponse.json({ message: 'Mật khẩu cũ không đúng' }, { status: 400 })

    const newpass = await hash(passnew, 10)
    const updatedUser = await prisma.user.update({ 
        where: { id: payload.id as string }, 
        data: { 
            password: newpass,
            tokenVersion: { increment: 1 }
        } 
    })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-123');
    const tokens = await new SignJWT({ 
        id: user.id, 
        name: user.name, 
        role: user.role,
        tokenVersion: updatedUser.tokenVersion
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1d')
        .sign(secret);
    const response = NextResponse.json({ message: 'Mật khẩu đã được thay đổi thành công' }, { status: 200 })
    response.cookies.set('token', tokens, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24,
        path: '/',
    })
    return response
}