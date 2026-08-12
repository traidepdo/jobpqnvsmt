import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Không tìm thấy trang (404) | Phú Quốc Jobs',
  description: 'Trang bạn yêu cầu không tìm thấy hoặc đã bị di chuyển. Khám phá hàng nghìn cơ hội việc làm hấp dẫn tại Phú Quốc ngay hôm nay.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <main className="min-h-[85vh] w-full flex flex-col items-center justify-center bg-slate-50 pt-[100px] pb-16 px-4">
      <div className="max-w-xl w-full text-center space-y-8 bg-white border border-slate-100 rounded-3xl p-8 md:p-12 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
        
        {/* Animated Icon / Illustration Container */}
        <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-50 animate-pulse" />
          <span className="material-symbols-outlined text-[80px] text-emerald-500 font-light select-none animate-bounce">
            error
          </span>
          <span className="absolute bottom-2 right-6 text-6xl font-black text-emerald-600/10 select-none font-mono">
            404
          </span>
        </div>

        {/* Messaging */}
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Không tìm thấy trang
          </h1>
          <p className="text-base text-gray-550 max-w-md mx-auto leading-relaxed">
            Đường liên kết có thể đã bị hỏng, hoặc trang bạn đang tìm kiếm đã bị xóa hoặc chuyển sang một địa chỉ mới.
          </p>
        </div>

        {/* Navigation CTAs */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/10 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">home</span>
            Quay lại trang chủ
          </Link>
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-slate-50 hover:border-slate-350 transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">search</span>
            Tìm việc làm
          </Link>
        </div>

        {/* Helpful links mapping for SEO spidering and easy recovery */}
        <div className="pt-8 border-t border-slate-100">
          <p className="text-[12px] font-bold text-slate-450 uppercase tracking-wider mb-4">
            Liên kết hữu ích cho bạn
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-w-xs mx-auto text-left">
            <Link href="/companies" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Danh sách công ty
            </Link>
            <Link href="/tao-cv" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Tạo CV xin việc
            </Link>
            <Link href="/blogs" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Cẩm nang nghề nghiệp
            </Link>
            <Link href="/register" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Đăng ký tài khoản
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
