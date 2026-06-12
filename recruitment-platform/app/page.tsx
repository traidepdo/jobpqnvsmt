'use client'
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatSalary, getJobTypeLabel } from '@/lib/jobLabels';
import "../styles/home.css"
import Hero from '@/components/hero';

// ─── Interfaces (unchanged) ────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  _count?: { jobs: number };
}

interface Job {
  id: string;
  title: string;
  slug: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  type: string;
  status: string;
  company: { name: string; logo?: string | null; slug?: string };
  category: { name: string };
  ward?: { name: string } | null;
  salaryStatus?: 'good' | 'average' | 'bad' | null;
  salaryDiff?: number;
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

const CATEGORY_ICONS: Record<string, string> = {
  hotel: 'hotel',
  restaurant: 'restaurant',
  tour: 'explore',
  security: 'shield',
  spa: 'spa',
  retail: 'shopping_bag',
  it: 'computer',
  default: 'work',
};

function getCategoryIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('hotel') || lower.includes('khách sạn') || lower.includes('resort')) return CATEGORY_ICONS.hotel;
  if (lower.includes('restaurant') || lower.includes('nhà hàng') || lower.includes('ăn') || lower.includes('f&b')) return CATEGORY_ICONS.restaurant;
  if (lower.includes('tour') || lower.includes('hướng dẫn') || lower.includes('du lịch')) return CATEGORY_ICONS.tour;
  if (lower.includes('security') || lower.includes('bảo vệ')) return CATEGORY_ICONS.security;
  if (lower.includes('spa') || lower.includes('beauty')) return CATEGORY_ICONS.spa;
  if (lower.includes('it') || lower.includes('tech') || lower.includes('công nghệ')) return CATEGORY_ICONS.it;
  if (lower.includes('retail') || lower.includes('bán lẻ') || lower.includes('bán hàng') || lower.includes('kinh doanh')) return 'shopping_bag';
  if (lower.includes('bảo hiểm')) return 'shield_with_heart';
  if (lower.includes('bất động sản')) return 'real_estate_agent';
  if (lower.includes('dệt may') || lower.includes('thời trang')) return 'apparel';
  if (lower.includes('dược') || lower.includes('hóa chất') || lower.includes('y tế')) return 'biotech';
  if (lower.includes('giáo dục') || lower.includes('đào tạo')) return 'school';
  if (lower.includes('kế toán') || lower.includes('tài chính')) return 'payments';
  return CATEGORY_ICONS.default;
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function PhuQuocJobs() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [heroImg, setHeroImg] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Parallax scroll state
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const res = await fetch('/api/public/home');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
          setFeaturedJobs(data.featuredJobs || []);
          setCompanies(data.companies || []);
          setWards(data.wards || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();


    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {

      window.removeEventListener('scroll', handleScroll);
    };
  }, []);



  // ─── Loading State ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 50%, #052e16 100%)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-green-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full border border-emerald-400/30 border-b-transparent animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '0.7s' }} />
          </div>
          <p className="text-green-300/70 text-sm font-medium tracking-wide">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

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
                <p className="text-gray-500 mt-2 text-sm">Khám phá cơ hội theo lĩnh vực bạn yêu thích</p>
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
              {(categories.length > 0 ? categories.slice(0, 8) : [
                { id: '1', name: 'Khách sạn & Resort', slug: 'hotel', _count: { jobs: 248 } },
                { id: '2', name: 'Nhà hàng & F&B', slug: 'restaurant', _count: { jobs: 183 } },
                { id: '3', name: 'Du lịch & Lữ hành', slug: 'tour', _count: { jobs: 97 } },
                { id: '4', name: 'Bảo vệ & An ninh', slug: 'security', _count: { jobs: 64 } },
              ]).map((cat, i) => (
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
                    <span className="material-symbols-outlined text-2xl text-green-600">{getCategoryIcon(cat.name)}</span>
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
          <section className="py-6 pb-24 px-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-green-600 mb-3"
                  style={{ letterSpacing: '0.15em' }}>✦ Nổi bật</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Việc làm nổi bật</h2>
                <p className="text-gray-500 mt-2 text-sm">Cập nhật mới nhất từ các nhà tuyển dụng uy tín</p>
              </div>
              <Link href="/jobs"
                className="hidden sm:flex items-center gap-1.5 text-green-600 text-sm font-bold hover:text-green-700 transition-colors group">
                Xem tất cả
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>

            {featuredJobs.length === 0 ? (
              <div className="text-center py-20 rounded-3xl"
                style={{ background: 'rgba(255,255,255,0.8)', border: '2px dashed rgba(22,163,74,0.2)' }}>
                <div className="text-5xl mb-4">💼</div>
                <p className="font-bold text-gray-700 mb-1 text-lg">Chưa có tin tuyển dụng</p>
                <p className="text-sm text-gray-400 mb-6">Vui lòng thử tải lại trang</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => window.location.reload()}
                    className="text-sm px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer font-medium transition-colors">
                    Tải lại
                  </button>
                  <Link href="/jobs"
                    className="text-sm px-5 py-2.5 text-white rounded-xl font-semibold transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                    Xem việc làm
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredJobs.map((job, idx) => (
                    <Link key={job.id} href={job.slug ? `/jobs/${job.slug}` : '/jobs'}
                      className="job-card-premium group relative block rounded-2xl p-5 overflow-hidden"
                      style={{
                        background: 'rgba(255,255,255,0.92)',
                        border: '1px solid rgba(22,163,74,0.1)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        animationDelay: `${idx * 0.05}s`,
                      }}>
                      {/* Top gradient accent */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: 'linear-gradient(90deg, #16a34a, #4ade80, #22c55e)' }} />

                      <div className="flex gap-4 items-start">
                        {/* Company logo */}
                        <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden transition-transform duration-300 group-hover:scale-105"
                          style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid rgba(22,163,74,0.15)' }}>
                          {job.company.logo ? (
                            <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🏢</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-green-700 transition-colors">{job.title}</h3>
                              <p className="text-xs text-gray-500 mt-0.5 font-medium">{job.company.name}</p>
                            </div>
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${job.status === 'ACTIVE'
                              ? 'text-green-700 bg-green-50 border border-green-200'
                              : 'text-amber-700 bg-amber-50 border border-amber-200'
                              }`}>
                              {job.status === 'ACTIVE' ? '● Đang tuyển' : '○ Sắp tuyển'}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 px-2.5 py-1 rounded-lg font-medium"
                              style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.12)' }}>
                              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                              </svg>
                              {job.ward?.name || 'Phú Quốc'}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 px-2.5 py-1 rounded-lg font-medium"
                              style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.12)' }}>
                              <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                              </svg>
                              {getJobTypeLabel(job.type)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 px-2.5 py-1 rounded-lg"
                              style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)' }}>
                              {formatSalary(job.salaryMin ?? null, job.salaryMax ?? null)}
                            </span>

                            {job.salaryStatus && (
                              <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${job.salaryStatus === 'good'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : job.salaryStatus === 'bad'
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                }`}>
                                <span>{job.salaryStatus === 'good' ? '✨' : job.salaryStatus === 'bad' ? '⚠️' : 'ℹ️'}</span>
                                <span>
                                  {job.salaryStatus === 'good'
                                    ? `Lương tốt (+${Math.abs(job.salaryDiff || 0)}%)`
                                    : job.salaryStatus === 'bad'
                                      ? `Lương thấp (-${Math.abs(job.salaryDiff || 0)}%)`
                                      : 'Lương cạnh tranh'}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* View all button */}
                <div className="text-center mt-10">
                  <Link href="/jobs"
                    className="shimmer-btn inline-flex items-center gap-2.5 font-bold text-sm px-8 py-3.5 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    style={{
                      color: '#16a34a',
                      border: '2px solid rgba(22,163,74,0.4)',
                      background: 'rgba(22,163,74,0.05)',
                      boxShadow: '0 4px 15px rgba(22,163,74,0.1)',
                    }}>
                    Xem tất cả việc làm
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                </div>
              </>
            )}
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
                      style={{ opacity: 0.65 }}>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300"
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
            CTA BANNER SECTION
        ═══════════════════════════════════════════════════════════════ */}
        <SectionWrapper>
          <section className="py-16 px-6 max-w-6xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden min-h-[340px] flex items-center">
              {/* Background image */}
              <img
                src="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=1400&auto=format&fit=crop&q=80"
                alt="Phú Quốc beach"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Dark green overlay */}
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(105deg, rgba(5,46,22,0.97) 0%, rgba(6,78,59,0.92) 40%, rgba(5,46,22,0.75) 70%, transparent 100%)' }} />

              {/* Blob inside banner */}
              <div className="blob-1 absolute -right-20 -top-20 w-[400px] h-[400px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)' }} />

              {/* Content */}
              <div className="relative z-10 px-10 py-12 max-w-lg">
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-green-400 mb-4"
                  style={{ letterSpacing: '0.15em' }}>✦ Nhà tuyển dụng</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4 leading-tight">
                  Bạn đang tìm kiếm<br />
                  <span className="text-gradient-green">nhân sự tài năng?</span>
                </h2>
                <p className="text-white/65 text-sm leading-relaxed mb-8">
                  Đăng tin tuyển dụng để tiếp cận hàng nghìn ứng viên tiềm năng tại Phú Quốc và khu vực lân cận.
                </p>

                <div className="flex gap-3 flex-wrap mb-10">
                  <button
                    onClick={() => router.push('/register/employer')}
                    className="shimmer-btn glow-btn text-white font-bold text-sm px-7 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.04] active:scale-[0.97]"
                    style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                    Đăng tin ngay
                  </button>
                  <button
                    onClick={() => router.push('/tao-cv')}
                    className="font-bold text-sm px-7 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/20"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(8px)' }}>
                    Tìm hiểu thêm
                  </button>
                </div>

                <div className="flex gap-10">
                  {[['500+', 'Tin đăng'], ['8,000+', 'Ứng viên'], ['350+', 'Doanh nghiệp']].map(([n, l]) => (
                    <div key={l}>
                      <div className="text-xl font-extrabold text-white"
                        style={{ textShadow: '0 0 20px rgba(34,197,94,0.5)' }}>{n}</div>
                      <div className="text-xs text-white/50 mt-0.5 font-medium">{l}</div>
                    </div>
                  ))}
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

// ─── Section Wrapper with Intersection Observer for reveal animation ────────
function SectionWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 0.8s cubic-bezier(.22,1,.36,1), transform 0.8s cubic-bezier(.22,1,.36,1)',
        willChange: 'opacity, transform',
      }}>
      {children}
    </div>
  );
}