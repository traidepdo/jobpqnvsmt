import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    // Lấy cookie state để so khớp chống tấn công CSRF
    const cookieState = req.headers.get("cookie")
        ?.split(";")
        .find(c => c.trim().startsWith("oauth_state="))
        ?.split("=")[1];

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    // 1. Kiểm tra state chống CSRF
    if (!state || !cookieState || state !== decodeURIComponent(cookieState)) {
        console.error("CSRF State mismatch!");
        return NextResponse.redirect(new URL("/login?error=Yêu cầu không hợp lệ. Vui lòng thử lại.", req.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL("/login?error=Không nhận được mã xác thực từ Google.", req.url));
    }

    try {
        // 2. Trao đổi Auth Code lấy Access Token
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenResponse.ok) {
            const errData = await tokenResponse.json();
            console.error("Google Token Exchange error:", errData);
            return NextResponse.redirect(new URL("/login?error=Lỗi khi trao đổi mã xác thực với Google.", req.url));
        }

        const tokens = await tokenResponse.json();
        const accessToken = tokens.access_token;

        // 3. Lấy thông tin User Profile từ Google
        const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!userinfoResponse.ok) {
            console.error("Google UserInfo error:", await userinfoResponse.text());
            return NextResponse.redirect(new URL("/login?error=Không lấy được thông tin tài khoản Google.", req.url));
        }

        const googleUser = await userinfoResponse.json();
        const { email, name, picture } = googleUser;

        if (!email) {
            return NextResponse.redirect(new URL("/login?error=Tài khoản Google của bạn không có địa chỉ email công khai.", req.url));
        }

        // 4. Tìm hoặc tạo người dùng trong cơ sở dữ liệu
        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Tạo mật khẩu ngẫu nhiên độ bảo mật cao vì user đăng nhập qua Google
            const randomPassword = crypto.randomUUID();
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = await prisma.user.create({
                data: {
                    email,
                    name: name || email.split("@")[0],
                    password: hashedPassword,
                    role: "CANDIDATE", // Mặc định tạo tài khoản là Ứng viên
                    avatar: picture || null,
                    isActive: true,
                    isLocked: false,
                },
            });
            console.log(`Created new Google user: ${email}`);
        } else {
            // Nếu user đã tồn tại nhưng bị khóa hoặc ngưng hoạt động
            if (!user.isActive || user.isLocked) {
                return NextResponse.redirect(new URL("/login?error=Tài khoản của bạn đã bị khóa hoặc ngừng kích hoạt.", req.url));
            }

            // Đồng bộ avatar từ Google nếu user cũ chưa có avatar
            if (!user.avatar && picture) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { avatar: picture },
                });
            }
        }

        // 5. Tạo JWT Token bằng thư viện jose (giống login thông thường)
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET environment variable is missing!");
        }
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({ id: user.id, name: user.name, role: user.role })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("1d") // Token có giá trị trong 1 ngày
            .sign(secret);

        // 6. Redirect về trang chủ kèm theo thiết lập cookie HttpOnly
        const response = NextResponse.redirect(new URL("/", req.url));

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24, // Hết hạn sau 1 ngày
            path: "/",
        });

        // Xóa cookie oauth_state tạm thời
        response.cookies.delete("oauth_state");

        return response;
    } catch (error) {
        console.error("Google Auth error:", error);
        return NextResponse.redirect(new URL("/login?error=Có lỗi hệ thống xảy ra khi đăng nhập bằng Google.", req.url));
    }
}
