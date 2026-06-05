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
    const strengthLabel = ['', 'Yếu', 'Trung bình', 'Khá mạnh', 'Rất mạnh'][passwordStrength];
    const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#16a34a'][passwordStrength];

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

    const EyeIcon = ({ open }: { open: boolean }) => open
        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3" strokeWidth={1.8}/></svg>
        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>;

    return (
        <>
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes floatY {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-10px); }
                }
                .anim-fade-up { animation: fadeUp 0.5s ease both; }
                .d1 { animation-delay: .05s; } .d2 { animation-delay: .1s; }
                .d3 { animation-delay: .15s; } .d4 { animation-delay: .2s; }
                .d5 { animation-delay: .25s; } .d6 { animation-delay: .3s; }
                .float-emoji { animation: floatY 3.5s ease-in-out infinite; }
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus {
                    -webkit-box-shadow: 0 0 0 1000px #f3f4f6 inset !important;
                    -webkit-text-fill-color: #111827 !important;
                    transition: background-color 5000s;
                }
            `}</style>

            <div className="min-h-screen flex">

                {/* ── LEFT PANEL ── */}
                <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 relative overflow-hidden"
                    style={{ background: 'linear-gradient(160deg, #15803d 0%, #16a34a 50%, #22c55e 100%)' }}>
                    <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/5" />
                    <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-white/5" />
                    <div className="absolute top-1/2 -right-10 w-40 h-40 rounded-full bg-white/5" />

                    {/* Brand */}
                    <div className="relative z-10">
                        <Link href="/" className="inline-flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg">🏝️</div>
                            <span className="text-white font-bold text-lg">PhuQuocJobs</span>
                        </Link>
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                        <div className="text-5xl mb-6 float-emoji">🚀</div>
                        <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
                            Bắt đầu hành trình<br />sự nghiệp của bạn
                        </h2>
                        <p className="text-white/70 text-sm leading-relaxed mb-8">
                            Tạo tài khoản miễn phí và kết nối với hàng trăm nhà tuyển dụng uy tín tại Phú Quốc.
                        </p>
                        <div className="space-y-3">
                            {[
                                { icon: '✨', text: 'Tạo hồ sơ ứng tuyển chuyên nghiệp' },
                                { icon: '⚡', text: 'Nộp hồ sơ nhanh chỉ 1 click' },
                                { icon: '🔔', text: 'Nhận thông báo việc làm phù hợp' },
                            ].map((f, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                                    <span className="text-xl">{f.icon}</span>
                                    <span className="text-white/90 text-sm font-medium">{f.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10">
                        <p className="text-white/40 text-xs">© 2026 PhuQuocJobs. All rights reserved.</p>
                    </div>
                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 overflow-y-auto">
                    <div className="w-full max-w-md py-8">

                        {/* Mobile logo */}
                        <div className="lg:hidden text-center mb-8 anim-fade-up">
                            <Link href="/" className="inline-flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                                    style={{ background: '#16a34a' }}>🏝️</div>
                                <span className="font-bold text-gray-900 text-lg">PhuQuocJobs</span>
                            </Link>
                        </div>

                        {/* Header */}
                        <div className="mb-7 anim-fade-up d1">
                            <h1 className="text-2xl font-extrabold text-gray-900">Tạo tài khoản</h1>
                            <p className="text-gray-500 text-sm mt-1">Miễn phí, nhanh chóng, dễ dàng 🎉</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl anim-fade-up">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth={2}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01"/>
                                </svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-4">
                            {/* Họ tên */}
                            <div className="anim-fade-up d1">
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                    Họ và tên <span className="text-red-400 normal-case">*</span>
                                </label>
                                <div className="flex items-center bg-gray-100 rounded-xl px-3.5 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-500/30 focus-within:shadow-sm transition-all border border-transparent focus-within:border-green-300">
                                    <svg className="w-4 h-4 text-gray-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <circle cx="12" cy="8" r="4" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} required
                                        placeholder="Nguyễn Văn A"
                                        className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"/>
                                    {name.length > 1 && (
                                        <svg className="w-4 h-4 text-green-500 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                        </svg>
                                    )}
                                </div>
                            </div>

                            {/* Email + Phone */}
                            <div className="grid grid-cols-2 gap-3 anim-fade-up d2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                        Email <span className="text-red-400 normal-case">*</span>
                                    </label>
                                    <div className="flex items-center bg-gray-100 rounded-xl px-3.5 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-500/30 focus-within:shadow-sm transition-all border border-transparent focus-within:border-green-300">
                                        <svg className="w-4 h-4 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                            placeholder="email@..."
                                            className="flex-1 min-w-0 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                        Điện thoại <span className="text-red-400 normal-case">*</span>
                                    </label>
                                    <div className="flex items-center bg-gray-100 rounded-xl px-3.5 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-500/30 focus-within:shadow-sm transition-all border border-transparent focus-within:border-green-300">
                                        <svg className="w-4 h-4 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 13.5 19.79 19.79 0 0 1 1.07 5c-.11-1.09.6-2.1 1.67-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L6.91 10.9a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                        </svg>
                                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                                            placeholder="09xxxxxxxx"
                                            className="flex-1 min-w-0 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"/>
                                    </div>
                                </div>
                            </div>

                            {/* Password + Confirm */}
                            <div className="grid grid-cols-2 gap-3 anim-fade-up d3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                        Mật khẩu <span className="text-red-400 normal-case">*</span>
                                    </label>
                                    <div className="flex items-center bg-gray-100 rounded-xl px-3.5 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-500/30 focus-within:shadow-sm transition-all border border-transparent focus-within:border-green-300">
                                        <svg className="w-4 h-4 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                                            placeholder="••••••••"
                                            className="flex-1 min-w-0 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"/>
                                        <button type="button" onClick={() => setShowPassword(s => !s)} tabIndex={-1}
                                            className="ml-1 text-gray-400 hover:text-gray-600 cursor-pointer shrink-0">
                                            <EyeIcon open={showPassword}/>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                        Xác nhận <span className="text-red-400 normal-case">*</span>
                                    </label>
                                    <div className={`flex items-center rounded-xl px-3.5 py-3 transition-all border ${
                                        confirmPassword && confirmPassword !== password
                                            ? 'bg-red-50 border-red-300 focus-within:ring-2 focus-within:ring-red-300/30'
                                            : 'bg-gray-100 border-transparent focus-within:bg-white focus-within:ring-2 focus-within:ring-green-500/30 focus-within:shadow-sm focus-within:border-green-300'
                                    }`}>
                                        <svg className="w-4 h-4 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                        <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                                            placeholder="••••••••"
                                            className="flex-1 min-w-0 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"/>
                                        <button type="button" onClick={() => setShowConfirm(s => !s)} tabIndex={-1}
                                            className="ml-1 text-gray-400 hover:text-gray-600 cursor-pointer shrink-0">
                                            <EyeIcon open={showConfirm}/>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Strength bar */}
                            {password.length > 0 && (
                                <div className="anim-fade-up space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        {[1,2,3,4].map(s => (
                                            <div key={s} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                                                style={{ background: passwordStrength >= s ? strengthColor : '#e5e7eb' }}/>
                                        ))}
                                        <span className="text-[11px] ml-1 w-20 text-right font-semibold shrink-0"
                                            style={{ color: strengthColor || '#9ca3af' }}>{strengthLabel}</span>
                                    </div>
                                </div>
                            )}

                            {/* Submit */}
                            <div className="anim-fade-up d5 pt-1">
                                <button type="submit" disabled={loading}
                                    className="w-full py-3 rounded-xl font-bold text-white text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:opacity-90 active:scale-[0.98]"
                                    style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)' }}>
                                    {loading
                                        ? <span className="flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                            </svg>
                                            Đang tạo tài khoản…
                                          </span>
                                        : 'Tạo tài khoản Ứng viên'
                                    }
                                </button>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="mt-7 text-center space-y-3 anim-fade-up d6">
                            <p className="text-sm text-gray-500">
                                Đã có tài khoản?{' '}
                                <Link href="/login" className="font-bold hover:underline" style={{ color: '#16a34a' }}>
                                    Đăng nhập ngay
                                </Link>
                            </p>
                            <div className="pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-400">
                                    Bạn đại diện cho công ty?{' '}
                                    <Link href="/register/employer" className="font-bold hover:underline" style={{ color: '#16a34a' }}>
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