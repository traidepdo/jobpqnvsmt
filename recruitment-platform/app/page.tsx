import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from "@/lib/prisma";
import { companyCardSelect } from "@/lib/prismaSafe";
import { verifyToken } from "@/lib/auth";
import "../styles/home.css"
import Hero from '@/components/hero';
import JobTop from '@/components/home/Jobtop';
import SectionWrapper from '@/components/home/SectionWrapper';

// ─── Interfaces ────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  _count?: { jobs: number };
}

interface Company {
  id: string;
  name: string;
  logo?: string | null;
  slug: string;
  icon?: string;
}

interface Ward {
  id: string;
  name: string;
}

async function getHomeData() {
  try {
    const [categories, companies, wards] = await Promise.all([
      prisma.category.findMany({
        include: {
          _count: {
            select: {
              jobs: {
                where: { status: "ACTIVE" }
              }
            }
          }
        }
      }),
      prisma.company.findMany({
        where: { isApproved: true, isActive: true },
        take: 6,
        select: companyCardSelect,
      }),
      prisma.ward.findMany({
        select: {
          id: true,
          name: true
        }
      })
    ]);

    // Lọc danh mục có ít nhất 1 công việc active, và sắp xếp theo số lượng nhiều nhất
    const sortedCategories = (categories as Category[])
      .filter(cat => (cat._count?.jobs ?? 0) > 0)
      .sort((a, b) => (b._count?.jobs ?? 0) - (a._count?.jobs ?? 0))
      .slice(0, 8);

    return {
      categories: sortedCategories,
      companies: companies as Company[],
      wards: wards as Ward[]
    };
  } catch (error) {
    console.error("Error loading home data:", error);
    return {
      categories: [],
      companies: [],
      wards: []
    };
  }
}

// ─── Component ─────────────────────────────────────────────────────────────
export default async function PhuQuocJobs() {
  const { categories, companies, wards } = await getHomeData();
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const payload = token ? await verifyToken(token) : null;
  const isLoggedIn = !!payload;
  const isEmployer = payload?.role === 'EMPLOYER';

  // ─── Main Render ───────────────────────────────────────────────────────
  return (
    <>
      <link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" />
      <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet" />

      <div className="min-h-screen text-gray-900 overflow-x-hidden"
        style={{ fontFamily: "'Be Vietnam Pro', sans-serif", background: '#f0fdf4' }}>

        {/* ═══════════════════════════════════════════════════════════════
            HERO SECTION
        ═══════════════════════════════════════════════════════════════ */}
        <Hero wards={wards} />

        {/* ═══════════════════════════════════════════════════════════════
            CATEGORIES SECTION
        ═══════════════════════════════════════════════════════════════ */}
        <SectionWrapper>
          <section className="py-24 px-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-green-600 mb-3"
                  style={{ letterSpacing: '0.15em' }}>✦ Khám phá</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                  Ngành nghề phổ biến
                </h2>
                <p className="text-gray-500 mt-2 text-sm">Khám phá cơ hội theo lĩnh vực bạn yêu thích (được sắp xếp theo số lượng việc làm nhiều nhất)</p>
              </div>
              <Link href="/jobs"
                className="hidden sm:flex items-center gap-1.5 text-green-600 text-sm font-bold hover:text-green-700 transition-colors group">
                Xem tất cả
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat, i) => (
                <Link key={cat.id} href={`/jobs?category=${cat.slug}`}
                  className="cat-card-premium group relative block rounded-2xl p-5 cursor-pointer overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(22,163,74,0.12)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                    '--i': i,
                  } as React.CSSProperties}>
                  {/* Background hover fill */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.04) 0%, rgba(74,222,128,0.06) 100%)' }} />
                  {/* Icon */}
                  <div className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(34,197,94,0.15))' }}>
                    <span className="material-symbols-outlined text-2xl text-green-600">{cat.icon || 'work'}</span>
                  </div>
                  <div className="relative font-semibold text-gray-900 text-sm leading-snug mb-1.5 group-hover:text-green-700 transition-colors">{cat.name}</div>
                  <div className="relative text-xs text-gray-400 font-medium">{cat._count?.jobs ?? 0}+ việc làm</div>
                  {/* Green accent line */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                    style={{ background: 'linear-gradient(90deg, #16a34a, #4ade80)' }} />
                </Link>
              ))}
            </div>
          </section>
        </SectionWrapper>

        {/* ═══════════════════════════════════════════════════════════════
            FEATURED JOBS SECTION
        ═══════════════════════════════════════════════════════════════ */}
        <SectionWrapper>
          <JobTop />
        </SectionWrapper>

        {/* ═══════════════════════════════════════════════════════════════
            ADVANTAGES & FEATURES SECTION (NEW & MORE LOGICAL)
        ═══════════════════════════════════════════════════════════════ */}
        <SectionWrapper>
          <section className="py-20 px-6 max-w-6xl mx-auto border-t border-green-100/55">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-green-600 mb-3"
                style={{ letterSpacing: '0.15em' }}>✦ Tại sao chọn chúng tôi</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Giải pháp tuyển dụng toàn diện</h2>
              <p className="text-gray-500 mt-3 text-sm">Rút ngắn khoảng cách giữa ứng viên tài năng và nhà tuyển dụng lý tưởng tại Phú Quốc</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-8 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-green-600 text-2xl">neurology</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Phân tích lương bằng AI</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Công nghệ học máy so sánh và đánh giá mức lương thực tế với thị trường, đảm bảo quyền lợi tối ưu và minh bạch cho cả hai phía.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-8 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-green-600 text-2xl">description</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Tạo CV chuyên nghiệp</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Công cụ thiết kế CV trực quan với nhiều mẫu giao diện hiện đại (Modern, Creative, Minimalist) giúp ứng viên gây ấn tượng mạnh mẽ với nhà tuyển dụng.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-8 rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-green-600 text-2xl">distance</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Cơ hội việc làm bản địa</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Tập trung kết nối sâu sắc các doanh nghiệp, resort, nhà hàng tại Dương Đông, An Thới, Hàm Ninh,... giúp bạn dễ dàng tìm kiếm việc gần nhà.
                </p>
              </div>
            </div>
          </section>
        </SectionWrapper>

        {/* ═══════════════════════════════════════════════════════════════
            EMPLOYERS SECTION
        ═══════════════════════════════════════════════════════════════ */}
        {companies.length > 0 && (
          <SectionWrapper>
            <section className="py-20 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.04) 0%, rgba(34,197,94,0.02) 100%)', borderTop: '1px solid rgba(22,163,74,0.1)', borderBottom: '1px solid rgba(22,163,74,0.1)' }}>
              <div className="max-w-6xl mx-auto px-6 text-center">
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-green-600 mb-3"
                  style={{ letterSpacing: '0.15em' }}>✦ Đối tác</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Nhà tuyển dụng hàng đầu</h2>
                <p className="text-sm text-gray-500 mb-12">Các thương hiệu lớn đang tuyển dụng tại Phú Quốc</p>

                <div className="flex flex-wrap justify-center items-center gap-5">
                  {companies.map((company, i) => (
                    <Link key={company.id} href={`/jobs?query=${encodeURIComponent(company.name)}`}
                      className="emp-card-premium group flex flex-col items-center gap-2.5 cursor-pointer"
                      style={{ opacity: 0.85 }}>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-105"
                        style={{
                          background: 'white',
                          border: '1px solid rgba(22,163,74,0.15)',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                        }}>
                        {company.logo ? (
                          <img src={company.logo} alt={company.name} className="w-full h-full object-contain p-2" />
                        ) : (
                          <span className="text-2xl">🏢</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 font-semibold group-hover:text-green-600 transition-colors">{company.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </SectionWrapper>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            DUAL CTA SECTION (MORE BALANCED & LOGICAL)
        ═══════════════════════════════════════════════════════════════ */}
        <SectionWrapper>
          <section className="py-24 px-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* For Candidates */}
              <div className="relative rounded-3xl overflow-hidden min-h-[300px] flex items-center p-8 md:p-12"
                style={{
                  background: 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)',
                  boxShadow: '0 10px 30px rgba(5,46,22,0.15)'
                }}>
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
                  <span className="material-symbols-outlined text-[200px] text-white">person_search</span>
                </div>
                <div className="relative z-10 max-w-md">
                  <span className="text-xs font-bold uppercase text-green-400 tracking-wider">Dành cho ứng viên</span>
                  <h3 className="text-2xl font-extrabold text-white mt-2 mb-3">Khởi tạo sự nghiệp tại Đảo Ngọc</h3>
                  <p className="text-green-100/70 text-sm leading-relaxed mb-6">
                    Sở hữu CV chuyên nghiệp vượt trội chỉ trong vài phút, ứng tuyển trực tiếp vào các khách sạn, resort lớn tại Phú Quốc.
                  </p>
                  <Link href={isLoggedIn ? "/tao-cv" : "/login?callbackUrl=/tao-cv"}
                    className="inline-flex items-center justify-center font-bold text-sm text-green-900 bg-green-400 hover:bg-green-300 px-6 py-3 rounded-xl transition-all duration-200 hover:scale-[1.03]">
                    Tạo CV chuyên nghiệp
                  </Link>
                </div>
              </div>

              {/* For Employers */}
              <div className="relative rounded-3xl overflow-hidden min-h-[300px] flex items-center p-8 md:p-12"
                style={{
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  boxShadow: '0 10px 30px rgba(15,23,42,0.15)'
                }}>
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
                  <span className="material-symbols-outlined text-[200px] text-white">business_center</span>
                </div>
                <div className="relative z-10 max-w-md">
                  <span className="text-xs font-bold uppercase text-blue-400 tracking-wider">Dành cho nhà tuyển dụng</span>
                  <h3 className="text-2xl font-extrabold text-white mt-2 mb-3">Tìm kiếm nhân tài phù hợp nhanh nhất</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    Đăng tin tuyển dụng và tiếp cận nhanh chóng nguồn ứng viên năng động tại Phú Quốc. Quản lý hồ sơ thông minh, chuyên nghiệp.
                  </p>
                  <Link href={isEmployer ? "/employer/dashboard" : "/register/employer"}
                    className="inline-flex items-center justify-center font-bold text-sm text-slate-900 bg-white hover:bg-slate-100 px-6 py-3 rounded-xl transition-all duration-200 hover:scale-[1.03]">
                    Đăng tin tuyển dụng ngay
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </SectionWrapper>

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </>
  );
}