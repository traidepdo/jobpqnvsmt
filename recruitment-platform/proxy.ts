import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is missing!");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Gắn pathname vào request headers để Server Components có thể đọc
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);

    // Cho phép các trang không cần xác thực
    if (pathname === '/unauthorized') return NextResponse.next();

    const token = request.cookies.get('token')?.value;

    // ==========================================
    // XỬ LÝ TRANG ĐĂNG NHẬP ADMIN
    // ==========================================
    if (pathname === '/admin/login') {
        if (token) {
            try {
                const { payload } = await jwtVerify(token, JWT_SECRET);
                const userRole = payload.role as string;
                if (userRole === 'ADMIN') {
                    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
                }
            } catch {
                const response = NextResponse.next();
                response.cookies.delete('token');
                return response;
            }
        }
        return NextResponse.next();
    }

    // ==========================================
    // XỬ LÝ TRANG ĐĂNG NHẬP THƯỜNG (Candidate/Employer)
    // ==========================================
    if (pathname === '/login') {
        if (token) {
            try {
                const { payload } = await jwtVerify(token, JWT_SECRET);
                const userRole = payload.role as string;
                if (userRole === 'ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
                if (userRole === 'EMPLOYER') return NextResponse.redirect(new URL('/employer/dashboard', request.url));
                if (userRole === 'CANDIDATE') {
                    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
                    if (callbackUrl) {
                        return NextResponse.redirect(new URL(callbackUrl, request.url));
                    }
                    return NextResponse.redirect(new URL('/', request.url));
                }
            } catch {
                const response = NextResponse.next();
                response.cookies.delete('token');
                return response;
            }
        }
        return NextResponse.next();
    }

    // ==========================================
    // XỬ LÝ CÁC TRANG ĐĂNG KÝ
    // ==========================================
    if (pathname === '/register' || pathname.startsWith('/register/')) {
        return NextResponse.next();
    }

    // ==========================================
    // XỬ LÝ CÁC TRANG BẢO VỆ THEO QUYỀN
    // ==========================================
    const isAdminRoute = pathname.startsWith('/admin');
    const isEmployerRoute = pathname.startsWith('/employer');
    const isCandidateRoute = pathname.startsWith('/candidate');
    const isTaoCvRoute = pathname.startsWith('/tao-cv') || pathname.startsWith('/sua-cv');

    if (isAdminRoute || isEmployerRoute || isCandidateRoute || isTaoCvRoute) {
        if (!token) {
            if (isAdminRoute) {
                return NextResponse.redirect(new URL('/admin/login', request.url));
            }
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }

        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            const userRole = payload.role as string;

            if (isAdminRoute && userRole !== 'ADMIN') {
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }
            if (isEmployerRoute && userRole !== 'EMPLOYER' && userRole !== 'ADMIN') {
                if (userRole === 'CANDIDATE') {
                    return NextResponse.redirect(new URL('/register/employer', request.url));
                }
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }
            if (isCandidateRoute && userRole !== 'CANDIDATE') {
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }
            if (isTaoCvRoute && userRole !== 'CANDIDATE') {
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }
        } catch {
            const response = NextResponse.redirect(
                new URL(isAdminRoute ? '/admin/login' : '/login', request.url)
            );
            response.cookies.delete('token');
            return response;
        }
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/employer/:path*',
        '/candidate/:path*',
        '/login',
        '/admin/login',
        '/register/:path*',
        '/tao-cv/:path*',
        '/sua-cv/:path*',
    ],
};
