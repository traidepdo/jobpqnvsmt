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
            { icon: '🎯', text: 'Hàng trăm việc làm phù hợp mỗi ngày' },
            { icon: '⚡', text: 'Nộp hồ sơ nhanh chỉ 1 click' },
            { icon: '🔔', text: 'Nhận thông báo việc làm tức thì' },
        ]
        : [
            { icon: '📢', text: 'Đăng tin tuyển dụng miễn phí' },
            { icon: '📊', text: 'Quản lý hồ sơ ứng viên thông minh' },
            { icon: '📈', text: 'Báo cáo hiệu suất chi tiết' },
        ];

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
                .d1 { animation-delay: .05s; }
                .d2 { animation-delay: .1s; }
                .d3 { animation-delay: .15s; }
                .d4 { animation-delay: .2s; }
                .d5 { animation-delay: .25s; }
                .float-emoji { animation: floatY 3.5s ease-in-out infinite; }
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus {
                    -webkit-box-shadow: 0 0 0 1000px #f9fafb inset !important;
                    -webkit-text-fill-color: #111827 !important;
                    transition: background-color 5000s;
                }
            `}</style>

            <div className="min-h-screen flex">

                {/* ── LEFT PANEL ── */}
                <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 relative overflow-hidden"
                    style={{ background: 'linear-gradient(160deg, #15803d 0%, #16a34a 50%, #22c55e 100%)' }}>

                    {/* Decorative circles */}
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

                    {/* Main content */}
                    <div className="relative z-10">
                        <div className="text-5xl mb-6 float-emoji">{isCandidate ? '🎯' : '🏢'}</div>
                        <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
                            {isCandidate ? 'Tìm việc làm\nmơ ước của bạn' : 'Tuyển dụng\nhiệu quả hơn'}
                        </h2>
                        <p className="text-white/70 text-sm leading-relaxed mb-8">
                            {isCandidate
                                ? 'Kết nối với hàng trăm nhà tuyển dụng uy tín tại Phú Quốc và toàn quốc.'
                                : 'Tiếp cận hàng nghìn ứng viên chất lượng, đăng tin và quản lý dễ dàng.'}
                        </p>
                        <div className="space-y-3">
                            {features.map((f, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                                    <span className="text-xl">{f.icon}</span>
                                    <span className="text-white/90 text-sm font-medium">{f.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom */}
                    <div className="relative z-10">
                        <p className="text-white/40 text-xs">© 2026 PhuQuocJobs. All rights reserved.</p>
                    </div>
                </div>

                {/* ── RIGHT PANEL (Form) ── */}
                <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
                    <div className="w-full max-w-sm">

                        {/* Mobile logo */}
                        <div className="lg:hidden text-center mb-8 anim-fade-up">
                            <Link href="/" className="inline-flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                                    style={{ background: '#16a34a' }}>🏝️</div>
                                <span className="font-bold text-gray-900 text-lg">PhuQuocJobs</span>
                            </Link>
                        </div>

                        {/* Header */}
                        <div className="mb-8 anim-fade-up d1">
                            <h1 className="text-2xl font-extrabold text-gray-900">Đăng nhập</h1>
                            <p className="text-gray-500 text-sm mt-1">Chào mừng trở lại 👋</p>
                        </div>

                        {/* Tab */}
                        <div className="flex bg-white border border-gray-200 rounded-xl p-1 mb-7 anim-fade-up d2 shadow-sm">
                            {(['candidate', 'employer'] as LoginMode[]).map((m) => (
                                <button key={m} type="button"
                                    onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                        mode === m
                                            ? 'text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                    style={mode === m ? { background: '#16a34a' } : {}}>
                                    {m === 'candidate' ? '👤 Ứng viên' : '🏢 Nhà tuyển dụng'}
                                </button>
                            ))}
                        </div>

                        {/* Alerts */}
                        {error && (
                            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl anim-fade-up">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth={2}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01"/>
                                </svg>
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-5 flex items-start gap-2.5 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl anim-fade-up">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                </svg>
                                {success}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="anim-fade-up d3">
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Email</label>
                                <div className="flex items-center bg-gray-100 rounded-xl px-3.5 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-500/30 focus-within:shadow-sm transition-all border border-transparent focus-within:border-green-300">
                                    <svg className="w-4 h-4 text-gray-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                        placeholder={isCandidate ? 'name@example.com' : 'hr@company.com'}
                                        className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"/>
                                </div>
                            </div>

                            <div className="anim-fade-up d4">
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Mật khẩu</label>
                                <div className="flex items-center bg-gray-100 rounded-xl px-3.5 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-500/30 focus-within:shadow-sm transition-all border border-transparent focus-within:border-green-300">
                                    <svg className="w-4 h-4 text-gray-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                                        placeholder="••••••••"
                                        className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"/>
                                    <button type="button" onClick={() => setShowPassword(s => !s)} tabIndex={-1}
                                        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                                        {showPassword
                                            ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3" strokeWidth={1.8}/></svg>
                                            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>
                                        }
                                    </button>
                                </div>
                            </div>

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
                                            Đang xác thực…
                                          </span>
                                        : `Đăng nhập ${isCandidate ? 'Ứng viên' : 'Nhà tuyển dụng'}`
                                    }
                                </button>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="mt-7 text-center space-y-3 anim-fade-up d5">
                            <p className="text-sm text-gray-500">
                                Chưa có tài khoản?{' '}
                                <Link href={isCandidate ? '/register' : '/register/employer'}
                                    className="font-bold hover:underline transition-colors"
                                    style={{ color: '#16a34a' }}>
                                    {isCandidate ? 'Đăng ký ngay' : 'Đăng ký Doanh nghiệp'}
                                </Link>
                            </p>
                            <div className="pt-3 border-t border-gray-100">
                                <Link href="/admin/login"
                                    className="text-xs text-gray-400 hover:text-gray-500 transition-colors flex items-center justify-center gap-1">
                                    🔐 Đăng nhập Quản trị viên
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}