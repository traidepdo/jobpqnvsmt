'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const passwordStrength = (() => {
        if (!password) return 0;
        if (password.length < 6) return 1;
        if (password.length < 8) return 2;
        if (password.length < 12) return 3;
        return 4;
    })();
    const strengthLabel = ['', 'Yêu', 'Trung bình', 'Khá mạnh', 'Rất mạnh'][passwordStrength];
    const strengthColor = ['', '#f43f5e', '#f97316', '#eab308', '#10b981'][passwordStrength];

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) { setError('Mật khẩu xác nhận không khớp!'); return; }
        if (password.length < 6) { setError('Mật khẩu phải chứa ít nhất 6 ký tự!'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, password, compassword: confirmPassword, role: 'CANDIDATE' }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Đăng ký thất bại. Vui lòng kiểm tra lại!'); }
            else { router.push('/login?registered=candidate'); router.refresh(); }
        } catch { setError('Không thể kết nối đến máy chủ.'); }
        finally { setLoading(false); }
    };

    const EyeIcon = ({ open }: { open: boolean }) => (
        <span className="material-symbols-outlined text-[18px]">
            {open ? 'visibility_off' : 'visibility'}
        </span>
    );

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
                .d6 { animation-delay: 0.3s; }
                
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
                
                {/* ── GLOBAL BACKDROP ── */}
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
                    
                    {/* LEFT PANEL: Branding & Info */}
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
                                <span className="material-symbols-outlined text-[28px]">rocket_launch</span>
                            </div>
                            
                            <h2 className="text-3xl font-extrabold text-white leading-tight mb-4 tracking-tight">
                                Bắt đầu hành trình sự nghiệp mới
                            </h2>
                            
                            <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                Tạo tài khoản ứng viên hoàn toàn miễn phí và kết nối trực tiếp đến hàng trăm cơ hội việc làm hấp dẫn tại Phú Quốc ngay hôm nay.
                            </p>
                        </div>

                        {/* Parallax Floating Cards */}
                        <div className="space-y-3">
                            {[
                                { icon: 'assignment_ind', title: 'Hồ sơ cá nhân hóa', text: 'Tạo CV trực quan, thu hút sự chú ý của nhà tuyển dụng.' },
                                { icon: 'electric_bolt', title: 'Ứng tuyển 1-Click', text: 'Nộp hồ sơ trực tiếp đến các resort, nhà hàng chỉ với một chạm.' },
                                { icon: 'notifications_active', title: 'Thông báo việc làm mới', text: 'Nhận gợi ý công việc dựa trên kỹ năng và vị trí mong muốn.' },
                            ].map((f, i) => (
                                <div 
                                    key={i} 
                                    className={`flex gap-3 p-3.5 rounded-2xl bg-slate-950/20 border border-white/10 backdrop-blur-xl hover:bg-slate-950/45 hover:border-white/20 transition-all duration-500 group shadow-lg float-card-${i + 1}`}
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

                    {/* RIGHT PANEL: Immersive Form (No Scroll) */}
                    <div className="w-full max-w-[460px] bg-black/45 border border-white/10 backdrop-blur-2xl p-6 md:p-8 rounded-3xl shadow-2xl shadow-black/40 anim-fade-up flex flex-col justify-between my-auto">
                        <div>
                            {/* Mobile Logo */}
                            <div className="lg:hidden text-center mb-6">
                                <Link href="/" className="inline-flex items-center gap-2">
                                    <span className="font-extrabold text-2xl tracking-tight text-white">
                                        Phú Quốc<span className="text-emerald-400">Jobs</span>
                                    </span>
                                </Link>
                            </div>

                            {/* Header */}
                            <div className="mb-6 anim-fade-up d1">
                                <h1 className="text-2xl font-extrabold text-white tracking-tight">Tạo tài khoản</h1>
                                <p className="text-slate-300 text-xs mt-1">Miễn phí, nhanh chóng và dễ dàng 👋</p>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <div className="mb-4 flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs p-3 rounded-xl anim-fade-up shadow-sm">
                                    <span className="material-symbols-outlined text-[18px] shrink-0 text-rose-400">error</span>
                                    <div>
                                        <p className="font-semibold">Đăng ký thất bại</p>
                                        <p className="text-[10px] text-rose-300 mt-0.5">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Compact Form */}
                            <form onSubmit={handleRegister} className="space-y-3.5">
                                {/* Name Field */}
                                <div className="anim-fade-up d1">
                                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Họ và tên *</label>
                                    <div className="flex items-center bg-black/20 rounded-xl px-3.5 py-2.5 border border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all duration-300">
                                        <span className="material-symbols-outlined text-slate-400 mr-2.5 shrink-0 text-[16px]">person</span>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            required
                                            placeholder="Nguyễn Văn A"
                                            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
                                        />
                                    </div>
                                </div>

                                {/* Email & Phone Row */}
                                <div className="grid grid-cols-2 gap-3.5 anim-fade-up d2">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Email *</label>
                                        <div className="flex items-center bg-black/20 rounded-xl px-3 py-2.5 border border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-300">
                                            <span className="material-symbols-outlined text-slate-400 mr-2 shrink-0 text-[16px]">mail</span>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                required
                                                placeholder="email@..."
                                                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full min-w-0"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Điện thoại *</label>
                                        <div className="flex items-center bg-black/20 rounded-xl px-3 py-2.5 border border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-300">
                                            <span className="material-symbols-outlined text-slate-400 mr-2 shrink-0 text-[16px]">call</span>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                required
                                                placeholder="09xxxxxxxx"
                                                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full min-w-0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Password & Confirm Password Row */}
                                <div className="grid grid-cols-2 gap-3.5 anim-fade-up d3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Mật khẩu *</label>
                                        <div className="flex items-center bg-black/20 rounded-xl px-3 py-2.5 border border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-300">
                                            <span className="material-symbols-outlined text-slate-400 mr-1.5 shrink-0 text-[16px]">lock</span>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                required
                                                placeholder="••••••••"
                                                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full min-w-0"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(s => !s)}
                                                tabIndex={-1}
                                                className="ml-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
                                            >
                                                <EyeIcon open={showPassword} />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Xác nhận *</label>
                                        <div className={`flex items-center rounded-xl px-3 py-2.5 border transition-all duration-300 ${
                                            confirmPassword && confirmPassword !== password
                                                ? 'bg-rose-500/10 border-rose-400/30'
                                                : 'bg-black/20 border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
                                        }`}>
                                            <span className="material-symbols-outlined text-slate-400 mr-1.5 shrink-0 text-[16px]">verified_user</span>
                                            <input
                                                type={showConfirm ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                required
                                                placeholder="••••••••"
                                                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full min-w-0"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(s => !s)}
                                                tabIndex={-1}
                                                className="ml-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
                                            >
                                                <EyeIcon open={showConfirm} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Password Strength Meter */}
                                {password.length > 0 && (
                                    <div className="anim-fade-up space-y-1.5 py-0.5">
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="text-slate-400 font-medium">Độ bảo mật:</span>
                                            <span className="font-bold" style={{ color: strengthColor }}>{strengthLabel}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {[1, 2, 3, 4].map(s => (
                                                <div
                                                    key={s}
                                                    className="h-1 flex-1 rounded-full transition-all duration-300"
                                                    style={{ background: passwordStrength >= s ? strengthColor : 'rgba(255,255,255,0.1)' }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="anim-fade-up d5 pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="shimmer-btn w-full py-3.5 rounded-xl font-bold text-white text-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 hover:scale-[1.01] shadow-lg shadow-emerald-500/20 active:scale-[0.99] flex items-center justify-center gap-1.5"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-1.5">
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                Đang xử lý...
                                            </span>
                                        ) : (
                                            <>
                                                <span>Tạo tài khoản ứng viên</span>
                                                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 text-center space-y-3 anim-fade-up d6">
                            <p className="text-xs text-slate-300">
                                Đã có tài khoản?{' '}
                                <Link href="/login" className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
                                    Đăng nhập ngay
                                </Link>
                            </p>
                            
                            <div className="pt-3 border-t border-white/10">
                                <p className="text-[10px] text-slate-400">
                                    Bạn đại diện cho công ty?{' '}
                                    <Link href="/register/employer" className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
                                        Đăng ký Nhà tuyển dụng 🏢
                                    </Link>
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}