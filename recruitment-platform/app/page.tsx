// app/page.tsx
import React from 'react';
import Link from 'next/link';
import Hero from '@/components/hero';
import JobTop from '@/components/home/Jobtop';
import SectionWrapper from '@/components/home/SectionWrapper';
import "../styles/home.css";

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
          <section className="py-24 px-6 max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-green-600 mb-3" style={{ letterSpacing: '0.15em' }}>✦ Khám phá</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">Ngành nghề phổ biến</h2>
                <p className="text-gray-500 mt-2 text-sm">Khám phá cơ hội theo lĩnh vực bạn yêu thích</p>
              </div>
              <Link href="/jobs" className="hidden sm:flex items-center gap-1.5 text-green-600 text-sm font-bold hover:text-green-700 transition-colors group">
                Xem tất cả
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat: any, i: number) => (
                <Link key={cat.id} href={`/jobs?category=${cat.slug}`}
                  className="cat-card-premium group relative block rounded-2xl p-5 cursor-pointer overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(22,163,74,0.12)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                    '--i': i,
                  } as React.CSSProperties}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.04) 0%, rgba(74,222,128,0.06) 100%)' }} />
                  <div className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110" style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(34,197,94,0.15))' }}>
                    <span className="material-symbols-outlined text-2xl text-green-600">{cat.icon || 'work'}</span>
                  </div>
                  <div className="relative font-semibold text-gray-900 text-sm leading-snug mb-1.5 group-hover:text-green-700 transition-colors">{cat.name}</div>
                  <div className="relative text-xs text-gray-400 font-medium">{cat._count?.jobs ?? 0}+ việc làm</div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" style={{ background: 'linear-gradient(90deg, #16a34a, #4ade80)' }} />
                </Link>
              ))}
            </div>
          </section>
        </SectionWrapper>

        {/* FEATURED JOBS SECTION */}
        <SectionWrapper>
          <JobTop />
        </SectionWrapper>

        {/* ADVANTAGES & FEATURES SECTION */}
        <SectionWrapper>
          <section className="py-20 px-6 max-w-6xl mx-auto border-t border-green-100/55">
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
            <section className="py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.03) 0%, rgba(34,197,94,0.01) 100%)', borderTop: '1px solid rgba(22,163,74,0.08)', borderBottom: '1px solid rgba(22,163,74,0.08)' }}>
              <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-12">
                  <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-[#00b14f] bg-green-50 px-3.5 py-1.5 rounded-full mb-3" style={{ letterSpacing: '0.12em' }}>
                    ✦ Đối tác tuyển dụng
                  </span>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                    Nhà tuyển dụng nổi bật
                  </h2>
                  <p className="text-gray-500 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
                    Những doanh nghiệp hàng đầu đang mở rộng cơ hội việc làm hấp dẫn và chào đón nhân tài tại Phú Quốc.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5 mt-10">
                  {companies.map((company: any) => (
                    <Link
                      key={company.id}
                      href={`/jobs?query=${encodeURIComponent(company.name)}`}
                      className="group flex flex-col items-center bg-white border border-gray-100 hover:border-green-300 rounded-3xl p-6 text-center relative overflow-hidden cursor-pointer shadow-[0_8px_30px_rgba(0,0,0,0.015)]"
                      style={{
                        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      {/* Shimmer Light Reflection effect */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full"
                        style={{
                          transition: 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      />

                      {/* Double Glowing background blobs */}
                      <div 
                        className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20"
                        style={{
                          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      />
                      <div 
                        className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#00b14f]/5 rounded-full blur-xl group-hover:bg-[#00b14f]/15"
                        style={{
                          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      />
                      
                      {/* Bottom sliding gradient border indicator */}
                      <div 
                        className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-emerald-500 via-green-400 to-[#00b14f] scale-x-0 group-hover:scale-x-100 origin-left"
                        style={{
                          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      />

                      {/* Company Logo container */}
                      <div 
                        className="w-18 h-18 rounded-2xl bg-gray-50 border border-gray-100/50 flex items-center justify-center overflow-hidden mb-4 group-hover:bg-white group-hover:border-green-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.015)]"
                        style={{
                          boxShadow: '0 4px 15px rgba(0,0,0,0.01)',
                          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        {company.logo ? (
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="w-full h-full object-contain p-2 group-hover:scale-105"
                            style={{
                              transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                          />
                        ) : (
                          <div 
                            className="w-full h-full bg-green-50/50 flex items-center justify-center text-3xl group-hover:scale-105"
                            style={{
                              transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                          >
                            🏢
                          </div>
                        )}
                      </div>

                      {/* Company Name */}
                      <h3 
                        className="text-xs font-bold text-gray-800 group-hover:text-[#00b14f] line-clamp-1 w-full px-1"
                        style={{
                          transition: 'color 0.4s ease'
                        }}
                      >
                        {company.name}
                      </h3>

                      {/* Job Count Badge */}
                      <div 
                        className="bg-green-50/70 text-[#00b14f] text-[10px] font-extrabold px-3 py-1.5 rounded-full mt-4 flex items-center gap-1.5 group-hover:bg-[#00b14f] group-hover:text-white group-hover:shadow-[0_4px_12px_rgba(0,177,79,0.25)]"
                        style={{
                          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        <span className="material-symbols-outlined text-[12px] font-bold">work</span>
                        <span>{company._count?.jobs || 0} tin tuyển dụng</span>
                      </div>

                      {/* Arrow icon sliding right */}
                      <div 
                        className="flex items-center gap-1 text-[10px] font-extrabold text-[#00b14f] mt-4 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
                        style={{
                          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        <span>Xem ngay</span>
                        <span className="material-symbols-outlined text-xs font-bold">arrow_forward</span>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="text-center mt-12">
                  <Link
                    href="/companies"
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#00b14f] bg-green-50/50 hover:bg-[#00b14f] hover:text-white px-6 py-3 rounded-2xl border border-green-100 hover:border-[#00b14f] transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 cursor-pointer"
                  >
                    <span>Xem thêm công ty</span>
                    <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </section>
          </SectionWrapper>
        )}

        {/* DUAL CTA SECTION */}
        <SectionWrapper>
          <section className="py-24 px-6 max-w-6xl mx-auto">
            <div className={`grid grid-cols-1 ${!isLoggedIn ? 'md:grid-cols-2' : ''} gap-8`}>
              {(!isLoggedIn || !isEmployer) && (
                <div className="relative rounded-3xl overflow-hidden min-h-[300px] flex items-center p-8 md:p-12" style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)' }}>
                  <div className="relative z-10 max-w-md">
                    <span className="text-xs font-bold uppercase text-green-400 tracking-wider">Dành cho ứng viên</span>
                    <h3 className="text-2xl font-extrabold text-white mt-2 mb-3">Khởi tạo sự nghiệp tại Đảo Ngọc</h3>
                    <Link href={isLoggedIn ? "/tao-cv" : "/login?callbackUrl=/tao-cv"} className="inline-flex items-center justify-center font-bold text-sm text-green-900 bg-green-400 hover:bg-green-300 px-6 py-3 rounded-xl transition-all">Tạo CV chuyên nghiệp</Link>
                  </div>
                </div>
              )}

              {(!isLoggedIn || isEmployer) && (
                <div className="relative rounded-3xl overflow-hidden min-h-[300px] flex items-center p-8 md:p-12" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
                  <div className="relative z-10 max-w-md">
                    <span className="text-xs font-bold uppercase text-blue-400 tracking-wider">Dành cho nhà tuyển dụng</span>
                    <h3 className="text-2xl font-extrabold text-white mt-2 mb-3">Tìm kiếm nhân tài phù hợp nhanh nhất</h3>
                    <Link href={isEmployer ? "/employer/dashboard" : "/register/employer"} className="inline-flex items-center justify-center font-bold text-sm text-slate-900 bg-white hover:bg-slate-100 px-6 py-3 rounded-xl transition-all">Đăng tin tuyển dụng ngay</Link>
                  </div>
                </div>
              )}
            </div>
          </section>
        </SectionWrapper>

        <div className="h-8" />
      </div>
    </>
  );
}