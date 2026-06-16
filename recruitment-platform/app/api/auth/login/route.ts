import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { SignJWT } from 'jose';


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;
        if (!email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }
        const user = await prisma.user.findUnique({
            where: { email }
        })
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }
        if (!user.isActive || user.isLocked) {
            return NextResponse.json({ error: "User is not active" }, { status: 403 })
        }
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 })
        }
        // 4. Tạo JWT Token bằng thư viện jose
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({ id: user.id, name: user.name, role: user.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('1d') // Token có giá trị trong 1 ngày
            .sign(secret);

        // 5. Trả về kết quả và đính kèm Token vào HttpOnly Cookie
        const response = NextResponse.json({
            message: 'Đăng nhập thành công!',
            user: { id: user.id, name: user.name, role: user.role },
        });

        response.cookies.set('token', token, {
            httpOnly: true, // Bảo vệ chống tấn công XSS
            secure: process.env.NODE_ENV === 'production', // Chỉ bật qua https khi deploy lên sản phẩm thật
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // Hết hạn sau 1 ngày (tính bằng giây)
            path: '/', // Áp dụng cho toàn bộ các trang trên website
        });

        return response;
    } catch (error) {
        console.error("Error logging in:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}