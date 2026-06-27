// app/page.tsx
import React from 'react';
import Link from 'next/link';
import Hero from '@/components/hero';
import JobTop from '@/components/home/Jobtop';
import SectionWrapper from '@/components/home/SectionWrapper';
import InteractiveCareerTool from '@/components/home/InteractiveCareerTool';
import "../styles/home.css";
import CompanyTop from '@/components/home/CompanyTop';
import Category from '@/components/home/Category';


async function fetchHomeData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const res = await fetch(`${baseUrl}/api/public/home`, {
      cache: 'no-store' // Đảm bảo luôn lấy data mới nhất (giống dữ liệu động cũ của bạn)
    });
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return { categories: [], companies: [], wards: [], isLoggedIn: false, isEmployer: false };
  }
}

export default async function PhuQuocJobsPage() {
  // Gọi API lấy dữ liệu sạch từ file Route
  const { categories, companies, wards, isLoggedIn, isEmployer } = await fetchHomeData();

  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" />
      <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <div className="min-h-screen text-gray-900 overflow-x-hidden" style={{ fontFamily: "'Be Vietnam Pro', sans-serif", background: '#f0fdf4' }}>

        {/* HERO SECTION */}
        <Hero wards={wards} />

        {/* CATEGORIES SECTION */}
        <SectionWrapper>
          <Category categories={categories} />
        </SectionWrapper>

        {/* FEATURED JOBS SECTION */}
        <SectionWrapper>
          <JobTop />
        </SectionWrapper>

        {/* ADVANTAGES & FEATURES SECTION */}
        <SectionWrapper>
          <section className="py-20 px-6 w-[1300px] mx-auto border-t border-green-100/55">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-green-600 mb-3" style={{ letterSpacing: '0.15em' }}>✦ Tại sao chọn chúng tôi</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Giải pháp tuyển dụng toàn diện</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-6"><span className="material-symbols-outlined text-green-600 text-2xl">neurology</span></div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Phân tích lương bằng AI</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Công nghệ học máy so sánh và đánh giá mức lương thực tế với thị trường.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-6"><span className="material-symbols-outlined text-green-600 text-2xl">description</span></div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Tạo CV chuyên nghiệp</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Công cụ thiết kế CV trực quan giúp ứng viên gây ấn tượng mạnh mẽ.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-6"><span className="material-symbols-outlined text-green-600 text-2xl">distance</span></div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Cơ hội việc làm bản địa</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Tập trung kết nối sâu sắc các doanh nghiệp lớn tại Dương Đông, An Thới...</p>
              </div>
            </div>
          </section>
        </SectionWrapper>

        {/* EMPLOYERS SECTION */}
        {companies.length > 0 && (
          <SectionWrapper>
            <CompanyTop companies={companies} />
          </SectionWrapper>
        )}

        {/* DUAL CTA SECTION */}
        <SectionWrapper>
          <InteractiveCareerTool
            categories={categories}
            isLoggedIn={isLoggedIn}
            isEmployer={isEmployer}
          />
        </SectionWrapper>

        <div className="h-8" />
      </div>
    </>
  );
}