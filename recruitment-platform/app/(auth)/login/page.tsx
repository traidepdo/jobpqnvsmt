'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type LoginMode = 'candidate' | 'employer';

export default function LoginPage() {
    const [mode, setMode] = useState<LoginMode>('candidate');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const registered = searchParams.get('registered');
        if (registered === 'candidate') setSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
        else if (registered === 'employer') setSuccess('Đăng ký thành công! Vui lòng chờ phê duyệt.');
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Đăng nhập thất bại. Kiểm tra lại email/mật khẩu!');
            } else {
                const role = data.user.role;
                if (role === 'ADMIN') router.push('/admin/dashboard');
                else if (role === 'EMPLOYER') router.push('/employer/dashboard');
                else router.push('/');
                router.refresh();
            }
        } catch { setError('Không thể kết nối đến máy chủ.'); }
        finally { setLoading(false); }
    };

    const isCandidate = mode === 'candidate';

    const features = isCandidate
        ? [
            { icon: 'explore', title: 'Khám phá cơ hội', text: 'Hàng trăm việc làm mới mỗi ngày từ các resort, khách sạn lớn.', floatClass: 'float-card-1' },
            { icon: 'bolt', title: 'Ứng tuyển nhanh', text: 'Nộp hồ sơ trực tuyến dễ dàng chỉ với một click chuột.', floatClass: 'float-card-2' },
            { icon: 'notifications', title: 'Thông báo tức thì', text: 'Theo dõi trạng thái hồ sơ tuyển dụng thời gian thực.', floatClass: 'float-card-3' },
        ]
        : [
            { icon: 'campaign', title: 'Đăng tin nhanh chóng', text: 'Tiếp cận hàng nghìn ứng viên chất lượng tại Phú Quốc.', floatClass: 'float-card-1' },
            { icon: 'bar_chart', title: 'Quản lý thông minh', text: 'Bộ công cụ lọc, đánh giá ứng viên chuyên nghiệp, hiện đại.', floatClass: 'float-card-2' },
            { icon: 'trending_up', title: 'Tối ưu hiệu quả', text: 'Báo cáo trực quan lượng xem tin và ứng tuyển chi tiết.', floatClass: 'float-card-3' },
        ];

    return (
        <>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes floatCard1 {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50%      { transform: translateY(-5px) rotate(0.3deg); }
                }
                @keyframes floatCard2 {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50%      { transform: translateY(-10px) rotate(-0.3deg); }
                }
                @keyframes floatCard3 {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50%      { transform: translateY(-6px) rotate(0.2deg); }
                }
                @keyframes kenBurns {
                    0%   { transform: scale(1) translate(0, 0); }
                    100% { transform: scale(1.12) translate(-1%, -0.5%); }
                }
                @keyframes shimmerEffect {
                    0%   { transform: translateX(-120%); }
                    100% { transform: translateX(120%); }
                }

                .anim-fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
                .d1 { animation-delay: 0.05s; }
                .d2 { animation-delay: 0.1s; }
                .d3 { animation-delay: 0.15s; }
                .d4 { animation-delay: 0.2s; }
                .d5 { animation-delay: 0.25s; }
                
                .ken-burns-bg {
                    animation: kenBurns 35s ease-in-out infinite alternate;
                }
                
                .float-card-1 { animation: floatCard1 6s ease-in-out infinite; }
                .float-card-2 { animation: floatCard2 8s ease-in-out infinite; }
                .float-card-3 { animation: floatCard3 7s ease-in-out infinite; }
                
                .shimmer-btn {
                    position: relative;
                    overflow: hidden;
                }
                .shimmer-btn::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    transform: translateX(-120%);
                }
                .shimmer-btn:hover::after {
                    animation: shimmerEffect 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                
                input:-webkit-autofill {
                    -webkit-box-shadow: 0 0 0 1000px #0b1f19 inset !important;
                    -webkit-text-fill-color: #ffffff !important;
                }
            `}</style>

            <div className="h-screen w-screen relative flex items-center justify-center font-sans overflow-hidden selection:bg-emerald-500 selection:text-white px-6">
                
                {/* ── GLOBAL BACKDROP (Full Screen Cinematic Motion) ── */}
                <div 
                    className="absolute inset-0 ken-burns-bg bg-cover bg-center"
                    style={{ 
                        backgroundImage: `url('https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1200&auto=format&fit=crop')`,
                    }}
                />
                
                {/* Immersive Dark Emerald-Teal Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#022c22]/98 via-[#041d18]/95 to-[#0b1329]/98 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#021f18] via-transparent to-transparent opacity-90" />

                {/* ── CONTENT CONTAINER ── */}
                <div className="relative z-10 w-full max-w-6xl h-full flex flex-col lg:flex-row items-center justify-between lg:justify-around py-6 lg:py-12">
                    
                    {/* LEFT PANEL: Branding & Floating Info Cards */}
                    <div className="hidden lg:flex flex-col justify-between h-full max-w-md text-white py-4">
                        <div>
                            {/* Logo */}
                            <Link href="/" className="inline-flex items-center gap-2.5 group mb-6">
                                <span className="font-extrabold text-2xl tracking-tight text-white">
                                    Phú Quốc<span className="text-emerald-400">Jobs</span>
                                </span>
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                            </Link>

                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black/30 border border-white/25 backdrop-blur-xl mb-6 text-emerald-400 shadow-2xl float-card-1">
                                <span className="material-symbols-outlined text-[28px]">{isCandidate ? 'ads_click' : 'domain'}</span>
                            </div>
                            
                            <h2 className="text-3xl font-extrabold text-white leading-tight mb-4 tracking-tight">
                                {isCandidate ? 'Tìm kiếm cơ hội sự nghiệp đột phá' : 'Thu hút & Quản lý nhân tài Phú Quốc'}
                            </h2>
                            
                            <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                {isCandidate
                                    ? 'Kết nối trực tiếp tới các doanh nghiệp hàng đầu tại đảo ngọc Phú Quốc. Tạo hồ sơ và ứng tuyển chỉ với vài thao tác đơn giản.'
                                    : 'Đăng tuyển dụng nhanh chóng, tiếp cận hàng chục ngàn ứng viên tiềm năng và tối ưu hóa quy trình tuyển dụng của bạn.'}
                            </p>
                        </div>

                        {/* Parallax Floating Cards */}
                        <div className="space-y-3">
                            {features.map((f, i) => (
                                <div 
                                    key={i} 
                                    className={`flex gap-3 p-3.5 rounded-2xl bg-slate-950/20 border border-white/10 backdrop-blur-xl hover:bg-slate-950/45 hover:border-white/20 transition-all duration-500 group shadow-lg ${f.floatClass}`}
                                >
                                    <div className="flex-shrink-0">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <span className="material-symbols-outlined text-[18px]">{f.icon}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-white mb-0.5">{f.title}</h4>
                                        <p className="text-[11px] text-slate-300/80 leading-normal">{f.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT PANEL: The Immersive Dark Glassmorphism Form (No Scroll) */}
                    <div className="w-full max-w-[420px] bg-black/45 border border-white/10 backdrop-blur-2xl p-6 md:p-8 rounded-3xl shadow-2xl shadow-black/40 anim-fade-up flex flex-col justify-between my-auto">
                        <div>
                            {/* Mobile Logo View */}
                            <div className="lg:hidden text-center mb-6">
                                <Link href="/" className="inline-flex items-center gap-2">
                                    <span className="font-extrabold text-2xl tracking-tight text-white">
                                        Phú Quốc<span className="text-emerald-400">Jobs</span>
                                    </span>
                                </Link>
                            </div>

                            {/* Form Title */}
                            <div className="mb-6 anim-fade-up d1">
                                <h1 className="text-2xl font-extrabold text-white tracking-tight">Đăng nhập</h1>
                                <p className="text-slate-300 text-xs mt-1">Chào mừng bạn trở lại! 👋</p>
                            </div>

                            {/* Sliding Tab Segmented Control */}
                            <div className="relative flex bg-white/[0.06] p-1 rounded-xl mb-6 anim-fade-up d2 border border-white/5">
                                <div 
                                    className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-emerald-500 rounded-lg shadow-lg transition-transform duration-300 ease-out"
                                    style={{
                                        transform: mode === 'candidate' ? 'translateX(0)' : 'translateX(100%)'
                                    }}
                                />
                                
                                <button
                                    type="button"
                                    onClick={() => { setMode('candidate'); setError(''); setSuccess(''); }}
                                    className={`relative z-10 flex-1 py-2.5 rounded-lg text-xs font-bold transition-colors duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
                                        mode === 'candidate' ? 'text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[16px]">person</span>
                                    Ứng viên
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => { setMode('employer'); setError(''); setSuccess(''); }}
                                    className={`relative z-10 flex-1 py-2.5 rounded-lg text-xs font-bold transition-colors duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${
                                        mode === 'employer' ? 'text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[16px]">business</span>
                                    Nhà tuyển dụng
                                </button>
                            </div>

                            {/* Alerts */}
                            {error && (
                                <div className="mb-4 flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs p-3 rounded-xl anim-fade-up shadow-sm">
                                    <span className="material-symbols-outlined text-[18px] shrink-0 text-rose-400">error</span>
                                    <div>
                                        <p className="font-semibold">Đăng nhập thất bại</p>
                                        <p className="text-[10px] text-rose-300 mt-0.5">{error}</p>
                                    </div>
                                </div>
                            )}
                            {success && (
                                <div className="mb-4 flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs p-3 rounded-xl anim-fade-up shadow-sm">
                                    <span className="material-symbols-outlined text-[18px] shrink-0 text-emerald-400">check_circle</span>
                                    <div>
                                        <p className="font-semibold">Thành công</p>
                                        <p className="text-[10px] text-emerald-300 mt-0.5">{success}</p>
                                    </div>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="anim-fade-up d3">
                                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Địa chỉ Email</label>
                                    <div className="flex items-center bg-black/20 rounded-xl px-3.5 py-2.5 border border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all duration-300">
                                        <span className="material-symbols-outlined text-slate-400 mr-2.5 shrink-0 text-[16px]">mail</span>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                            placeholder={isCandidate ? 'name@example.com' : 'hr@company.com'}
                                            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
                                        />
                                    </div>
                                </div>

                                <div className="anim-fade-up d4">
                                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Mật khẩu</label>
                                    <div className="flex items-center bg-black/20 rounded-xl px-3.5 py-2.5 border border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all duration-300">
                                        <span className="material-symbols-outlined text-slate-400 mr-2.5 shrink-0 text-[16px]">lock</span>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                            placeholder="••••••••"
                                            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(s => !s)}
                                            tabIndex={-1}
                                            className="ml-2 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div className="anim-fade-up d5 pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="shimmer-btn w-full py-3 rounded-xl font-bold text-white text-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 hover:scale-[1.01] shadow-lg shadow-emerald-500/20 active:scale-[0.99] flex items-center justify-center gap-1.5"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-1.5">
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                Đang xác thực...
                                            </span>
                                        ) : (
                                            <>
                                                <span>Đăng nhập {isCandidate ? 'Ứng viên' : 'Nhà tuyển dụng'}</span>
                                                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Footer Links */}
                        <div className="mt-6 text-center space-y-3 anim-fade-up d5">
                            <p className="text-xs text-slate-300">
                                Chưa có tài khoản?{' '}
                                <Link
                                    href={isCandidate ? '/register' : '/register/employer'}
                                    className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                                >
                                    {isCandidate ? 'Đăng ký ứng tuyển' : 'Đăng ký nhà tuyển dụng'}
                                </Link>
                            </p>
                            
                            <div className="pt-3 border-t border-white/10 flex justify-center">
                                <Link
                                    href="/admin/login"
                                    className="text-[10px] text-slate-400 hover:text-slate-300 hover:underline transition-colors flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[12px]">lock_person</span>
                                    Cổng Quản trị viên
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}