// src/app/_components/Hero/index.js
'use client';
import { useState, useEffect, useRef } from 'react';
import { HeroBg } from './HeroBg';
import { HeroSlider } from './HeroSlider';
import { SearchBox } from './SearchBox';

const HERO_IMAGES = [
    'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=1400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559628233-100c798642d4?w=1400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1400&auto=format&fit=crop&q=80',
];

export default function Hero({ wards }) {
    const heroRef = useRef(null);
    const [heroImg, setHeroImg] = useState(0);
    const [scrollY, setScrollY] = useState(0);

    // Kích hoạt hiệu ứng slide và parallax scroll
    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });

        const interval = setInterval(() => {
            setHeroImg(prev => (prev + 1) % HERO_IMAGES.length);
        }, 5000); // Tự động chuyển ảnh sau 5s

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(interval);
        };
    }, []);

    return (
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 40%, #065f46 70%, #052e16 100%)' }}>

            {/* 1. Phần ảnh chạy nền Parallax */}
            <HeroSlider images={HERO_IMAGES} heroImg={heroImg} scrollY={scrollY} />

            {/* 2. Phần Blobs trang trí tĩnh */}
            <HeroBg />

            {/* ── Dot indicators ── */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {HERO_IMAGES.map((_, i) => (
                    <button key={i} onClick={() => setHeroImg(i)}
                        className={`rounded-full transition-all duration-300 cursor-pointer ${i === heroImg ? 'w-6 h-2 bg-green-400' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`} />
                ))}
            </div>

            {/* ── Hero content chính ── */}
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

                {/* 3. Khối Search Box chứa tương tác logic phức tạp */}
                <div className="fade-up d-400 relative z-20">
                    <SearchBox wards={wards} />
                </div>

                {/* Stats */}
                <div className="fade-up d-500 flex justify-center gap-10 mt-10 relative z-10">
                    {[['1,200+', 'Việc làm'], ['350+', 'Nhà tuyển dụng'], ['8,000+', 'Ứng viên']].map(([n, l], i) => (
                        <div key={l} className="text-center" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                            <div className="text-2xl font-extrabold text-white mb-0.5" style={{ textShadow: '0 0 20px rgba(34,197,94,0.5)' }}>{n}</div>
                            <div className="text-xs text-white/50 font-medium tracking-wide">{l}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                style={{ background: 'linear-gradient(to top, #f0fdf4 0%, transparent 100%)' }} />
        </section>
    );
}