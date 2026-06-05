'use client'
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatSalary, getJobTypeLabel } from '@/lib/jobLabels';

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

// ─── Constants (unchanged) ─────────────────────────────────────────────────
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559628233-100c798642d4?w=1400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1400&auto=format&fit=crop&q=80',
];

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

    const imgInterval = setInterval(() => {
      setHeroImg(i => (i + 1) % HERO_IMAGES.length);
    }, 5000);

    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearInterval(imgInterval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('query', searchQuery);
    if (selectedLocation) params.append('location', selectedLocation);
    router.push(`/jobs?${params.toString()}`);
  };

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

      <style>{`
        body { font-family: 'Be Vietnam Pro', sans-serif; }

        /* ── Parallax keyframes ── */
        @keyframes blob-float-1 {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          25%      { transform: translate3d(50px,-35px,0) scale(1.1); }
          50%      { transform: translate3d(-25px,55px,0) scale(0.93); }
          75%      { transform: translate3d(35px,20px,0) scale(1.07); }
        }
        @keyframes blob-float-2 {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          33%      { transform: translate3d(-45px,30px,0) scale(1.08); }
          66%      { transform: translate3d(40px,-45px,0) scale(0.95); }
        }
        @keyframes blob-float-3 {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          40%      { transform: translate3d(30px,40px,0) scale(1.12); }
          70%      { transform: translate3d(-40px,-25px,0) scale(0.91); }
        }
        @keyframes particle-drift {
          0%   { transform: translate3d(0,0,0) scale(1); opacity:0.7; }
          33%  { transform: translate3d(12px,-24px,0) scale(1.3); opacity:1; }
          66%  { transform: translate3d(-8px,-10px,0) scale(0.8); opacity:0.4; }
          100% { transform: translate3d(0,0,0) scale(1); opacity:0.7; }
        }
        @keyframes orb-breathe {
          0%,100% { transform: scale(1); opacity:0.18; }
          50%      { transform: scale(1.3); opacity:0.35; }
        }
        @keyframes fade-up-in {
          from { opacity:0; transform: translate3d(0,28px,0); }
          to   { opacity:1; transform: translate3d(0,0,0); }
        }
        @keyframes scale-in {
          from { opacity:0; transform: scale(0.94); }
          to   { opacity:1; transform: scale(1); }
        }
        @keyframes reveal-left {
          from { opacity:0; transform: translate3d(-32px,0,0); }
          to   { opacity:1; transform: translate3d(0,0,0); }
        }
        @keyframes spin-ring {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmer-sweep {
          from { transform: translateX(-100%) skewX(-15deg); }
          to   { transform: translateX(300%) skewX(-15deg); }
        }
        @keyframes float-badge {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes glow-pulse {
          0%,100% { box-shadow: 0 0 20px rgba(34,197,94,0.3), 0 0 60px rgba(22,163,74,0.1); }
          50%      { box-shadow: 0 0 35px rgba(34,197,94,0.55), 0 0 100px rgba(22,163,74,0.2); }
        }
        @keyframes text-shimmer {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes counter-up {
          from { opacity:0; transform: translateY(10px); }
          to   { opacity:1; transform: translateY(0); }
        }

        /* ── Utility ── */
        .blob-1 { animation: blob-float-1 16s ease-in-out infinite; will-change: transform; }
        .blob-2 { animation: blob-float-2 20s ease-in-out infinite; will-change: transform; }
        .blob-3 { animation: blob-float-3 14s ease-in-out infinite; will-change: transform; }
        .blob-4 { animation: blob-float-2 24s ease-in-out infinite reverse; will-change: transform; }
        .blob-5 { animation: blob-float-1 18s ease-in-out infinite reverse; will-change: transform; }

        .p1 { animation: particle-drift 7s ease-in-out infinite; }
        .p2 { animation: particle-drift 9s ease-in-out infinite 1s; }
        .p3 { animation: particle-drift 6s ease-in-out infinite 2s; }
        .p4 { animation: particle-drift 8s ease-in-out infinite 0.5s; }
        .p5 { animation: particle-drift 10s ease-in-out infinite 3s; }
        .p6 { animation: particle-drift 5s ease-in-out infinite 1.5s; }
        .p7 { animation: particle-drift 12s ease-in-out infinite 2.5s; }
        .p8 { animation: particle-drift 8s ease-in-out infinite 4s; }

        .orb-1 { animation: orb-breathe 5s ease-in-out infinite; }
        .orb-2 { animation: orb-breathe 7s ease-in-out infinite 2s; }
        .orb-3 { animation: orb-breathe 6s ease-in-out infinite 1s; }

        .spin-ring { animation: spin-ring 30s linear infinite; }
        .spin-ring-r { animation: spin-ring 20s linear infinite reverse; }

        .fade-up { animation: fade-up-in 0.65s cubic-bezier(.22,1,.36,1) both; }
        .scale-in { animation: scale-in 0.6s cubic-bezier(.22,1,.36,1) both; }
        .reveal-left { animation: reveal-left 0.6s cubic-bezier(.22,1,.36,1) both; }

        .float-badge { animation: float-badge 3s ease-in-out infinite; }
        .glow-btn { animation: glow-pulse 3s ease-in-out infinite; }

        .text-gradient-green {
          background: linear-gradient(90deg, #4ade80, #22c55e, #16a34a, #4ade80);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: text-shimmer 4s linear infinite;
        }

        .d-100 { animation-delay: 0.1s; }
        .d-200 { animation-delay: 0.2s; }
        .d-300 { animation-delay: 0.3s; }
        .d-400 { animation-delay: 0.4s; }
        .d-500 { animation-delay: 0.5s; }
        .d-600 { animation-delay: 0.6s; }
        .d-700 { animation-delay: 0.7s; }
        .d-800 { animation-delay: 0.8s; }

        /* ── Job Card ── */
        .job-card-premium {
          transition: transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s ease, border-color 0.3s ease;
          will-change: transform;
        }
        .job-card-premium:hover {
          transform: translateY(-8px) scale(1.015);
          box-shadow: 0 20px 50px rgba(22,163,74,0.18), 0 8px 20px rgba(0,0,0,0.15);
          border-color: rgba(34,197,94,0.4);
        }

        /* ── Category Card ── */
        .cat-card-premium {
          transition: transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s ease, border-color 0.3s ease;
          will-change: transform;
        }
        .cat-card-premium:hover {
          transform: translateY(-6px) scale(1.03);
          box-shadow: 0 16px 40px rgba(22,163,74,0.2);
          border-color: rgba(34,197,94,0.5);
        }

        /* ── Company Card ── */
        .emp-card-premium {
          transition: transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease;
        }
        .emp-card-premium:hover {
          transform: translateY(-4px) scale(1.06);
          opacity: 1 !important;
          box-shadow: 0 12px 30px rgba(22,163,74,0.25);
        }

        /* ── Shimmer button ── */
        .shimmer-btn { position: relative; overflow: hidden; }
        .shimmer-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transform: translateX(-100%) skewX(-15deg);
        }
        .shimmer-btn:hover::after { animation: shimmer-sweep 0.7s ease forwards; }

        /* ── Glass input ── */
        .glass-input-green:focus-within {
          border-color: rgba(34,197,94,0.6);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.15), 0 8px 25px rgba(22,163,74,0.1);
        }

        /* ── Section reveal (Intersection Observer driven via data-attr) ── */
        .section-hidden {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(.22,1,.36,1), transform 0.8s cubic-bezier(.22,1,.36,1);
        }
        .section-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .stagger-child { transition-delay: calc(var(--i, 0) * 0.08s); }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #052e16; }
        ::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.4); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(34,197,94,0.7); }
      `}</style>

      <div className="min-h-screen text-gray-900 overflow-x-hidden"
        style={{ fontFamily: "'Be Vietnam Pro', sans-serif", background: '#f0fdf4' }}>

        {/* ═══════════════════════════════════════════════════════════════
            HERO SECTION
        ═══════════════════════════════════════════════════════════════ */}
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 40%, #065f46 70%, #052e16 100%)' }}>

          {/* ── Parallax background layer ── */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ transform: `translate3d(0, ${scrollY * 0.4}px, 0)`, willChange: 'transform' }}>
            {HERO_IMAGES.map((src, i) => (
              <img key={src} src={src} alt="" aria-hidden
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms]"
                style={{ opacity: i === heroImg ? 0.08 : 0 }} />
            ))}
          </div>

          {/* ── Animated green blobs ── */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="blob-1 absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.25) 0%, transparent 70%)' }} />
            <div className="blob-2 absolute top-1/3 -right-56 w-[600px] h-[600px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%)' }} />
            <div className="blob-3 absolute -bottom-48 left-1/4 w-[550px] h-[550px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.14) 0%, transparent 70%)' }} />
            <div className="blob-4 absolute top-1/4 left-1/2 w-[400px] h-[400px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)' }} />
            <div className="blob-5 absolute bottom-1/4 -right-20 w-[450px] h-[450px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)' }} />

            {/* Light orbs */}
            <div className="orb-1 absolute top-1/3 left-1/4 w-56 h-56 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)' }} />
            <div className="orb-2 absolute bottom-1/3 right-1/3 w-40 h-40 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.22) 0%, transparent 70%)' }} />
            <div className="orb-3 absolute top-2/3 left-2/3 w-32 h-32 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.2) 0%, transparent 70%)' }} />

            {/* Grid */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'linear-gradient(rgba(34,197,94,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.3) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

            {/* Particles */}
            <div className="p1 absolute top-[18%] left-[12%] w-1.5 h-1.5 rounded-full bg-green-400/70" />
            <div className="p2 absolute top-[65%] left-[7%] w-1 h-1 rounded-full bg-emerald-300/60" />
            <div className="p3 absolute top-[32%] right-[10%] w-2 h-2 rounded-full bg-lime-400/50" />
            <div className="p4 absolute bottom-[22%] left-[42%] w-1.5 h-1.5 rounded-full bg-green-300/60" />
            <div className="p5 absolute top-[78%] right-[28%] w-1 h-1 rounded-full bg-emerald-400/55" />
            <div className="p6 absolute top-[12%] right-[35%] w-2 h-2 rounded-full bg-green-500/40" />
            <div className="p7 absolute top-[48%] right-[6%] w-1.5 h-1.5 rounded-full bg-lime-300/45" />
            <div className="p8 absolute bottom-[15%] left-[22%] w-1 h-1 rounded-full bg-green-400/50" />
          </div>

          {/* Decorative rings */}
          <div className="spin-ring pointer-events-none absolute w-[900px] h-[900px] rounded-full border border-green-400/[0.05]"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div className="spin-ring-r pointer-events-none absolute w-[650px] h-[650px] rounded-full border border-emerald-300/[0.06]"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

          {/* ── Dot indicators ── */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {HERO_IMAGES.map((_, i) => (
              <button key={i} onClick={() => setHeroImg(i)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${i === heroImg ? 'w-6 h-2 bg-green-400' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`} />
            ))}
          </div>

          {/* ── Hero content ── */}
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center"
            style={{ transform: `translate3d(0, ${scrollY * -0.15}px, 0)`, willChange: 'transform' }}>

            {/* Badge */}
            <div className="fade-up d-100 mb-8">
              <span className="float-badge inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-sm font-semibold text-green-300"
                style={{
                  background: 'rgba(22,163,74,0.15)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 4px 20px rgba(22,163,74,0.15)',
                }}>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                500+ việc làm đang tuyển tại Phú Quốc
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </span>
            </div>

            {/* Headline */}
            <h1 className="fade-up d-200 text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
              Tìm việc làm tại<br />
              <span className="text-gradient-green">Đảo Ngọc Phú Quốc</span>
            </h1>

            <p className="fade-up d-300 text-lg text-white/60 mb-12 max-w-lg mx-auto leading-relaxed">
              Kết nối ứng viên với các nhà tuyển dụng hàng đầu tại điểm đến du lịch đẹp nhất Việt Nam.
            </p>

            {/* ── Search Box ── */}
            <div className="fade-up d-400">
              <div className="glass-input-green relative flex flex-col md:flex-row gap-2 p-2 rounded-2xl max-w-2xl mx-auto transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
                }}>
                {/* Search input */}
                <div className="flex items-center gap-3 flex-1 px-4 py-2.5"
                  style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                  <svg className="w-4 h-4 text-green-400/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Tên công việc, từ khóa..."
                    className="w-full bg-transparent text-sm text-white placeholder-white/35 outline-none font-medium"
                  />
                </div>
                {/* Location select */}
                <div className="flex items-center gap-3 px-4 py-2.5 min-w-[180px]">
                  <svg className="w-4 h-4 text-green-400/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  <select
                    value={selectedLocation}
                    onChange={e => setSelectedLocation(e.target.value)}
                    className={`w-full bg-transparent text-sm outline-none cursor-pointer ${selectedLocation ? 'text-white' : 'text-white/40'}`}
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" style={{ background: '#052e16' }}>Tất cả khu vực</option>
                    {wards.length > 0 ? wards.map(w => (
                      <option key={w.id} value={w.name} style={{ background: '#052e16' }}>{w.name}</option>
                    )) : (
                      <>
                        <option value="Dương Đông" style={{ background: '#052e16' }}>Dương Đông</option>
                        <option value="An Thới" style={{ background: '#052e16' }}>An Thới</option>
                        <option value="Phú Quốc" style={{ background: '#052e16' }}>Phú Quốc (toàn đảo)</option>
                      </>
                    )}
                  </select>
                </div>
                {/* Search button */}
                <button onClick={handleSearch}
                  className="shimmer-btn glow-btn text-white font-bold text-sm px-8 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' }}>
                  Tìm việc ngay
                </button>
              </div>

              {/* Stats */}
              <div className="fade-up d-500 flex justify-center gap-10 mt-10">
                {[['1,200+', 'Việc làm'], ['350+', 'Nhà tuyển dụng'], ['8,000+', 'Ứng viên']].map(([n, l], i) => (
                  <div key={l} className="text-center" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                    <div className="text-2xl font-extrabold text-white mb-0.5"
                      style={{ textShadow: '0 0 20px rgba(34,197,94,0.5)' }}>{n}</div>
                    <div className="text-xs text-white/50 font-medium tracking-wide">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
            style={{ background: 'linear-gradient(to top, #f0fdf4 0%, transparent 100%)' }} />
        </section>

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
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                              job.status === 'ACTIVE'
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
                              {formatSalary(job.salaryMin, job.salaryMax)}
                            </span>
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