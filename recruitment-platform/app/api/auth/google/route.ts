import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            return NextResponse.json({ error: "GOOGLE_CLIENT_ID is not configured in env" }, { status: 500 });
        }

        const host = req.headers.get("host") || "localhost:3000";
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

        // Tạo state ngẫu nhiên để chống tấn công CSRF
        const state = crypto.randomUUID();

        // Xây dựng Google OAuth URL
        const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        googleAuthUrl.searchParams.set("client_id", clientId);
        googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
        googleAuthUrl.searchParams.set("response_type", "code");
        googleAuthUrl.searchParams.set("scope", "openid profile email");
        googleAuthUrl.searchParams.set("state", state);
        googleAuthUrl.searchParams.set("prompt", "select_account"); // Ép chọn tài khoản để dễ test

        const response = NextResponse.redirect(googleAuthUrl.toString());

        // Lưu state vào httpOnly cookie (hết hạn sau 10 phút)
        response.cookies.set("oauth_state", state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 10,
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Error starting Google OAuth:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
