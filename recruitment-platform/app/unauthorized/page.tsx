"use client";

import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-6 py-12">
            <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">

                {/* Icon Cảnh báo khóa/chặn */}
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 mb-6 animate-pulse">
                    <svg
                        className="h-10 w-10 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                        />
                    </svg>
                </div>

                {/* Mã lỗi & Tiêu đề */}
                <span className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                    Lỗi 403 • Truy cập bị từ chối
                </span>
                <h1 className="mt-2 text-2xl font-bold text-gray-950 tracking-tight sm:text-3xl">
                    Bạn không có quyền vào đây
                </h1>

                {/* Đoạn văn mô tả */}
                <p className="mt-4 text-base text-gray-500 leading-relaxed">
                    Tài khoản hiện tại của bạn không được cấp quyền để truy cập vào phân vùng này. Vui lòng kiểm tra lại hoặc đăng nhập bằng tài khoản phù hợp hơn.
                </p>

                {/* Các nút điều hướng */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => router.push("/")}
                        className="inline-flex justify-center items-center px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
                    >
                        Về Trang Chủ
                    </button>

                    <button
                        onClick={() => {
                            // Đẩy về trang login để họ đăng nhập tài khoản khác có quyền chuẩn hơn
                            router.push("/login");
                            router.refresh();
                        }}
                        className="inline-flex justify-center items-center px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
                    >
                        Đăng Nhập Tài Khoản Khác
                    </button>
                </div>

                {/* Gợi ý nhỏ bên dưới */}
                <div className="mt-8 border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400">
                        Nếu bạn nghĩ đây là lỗi của hệ thống, vui lòng liên hệ với bộ phận Quản trị viên để được hỗ trợ.
                    </p>
                </div>

            </div>
        </div>
    );
}