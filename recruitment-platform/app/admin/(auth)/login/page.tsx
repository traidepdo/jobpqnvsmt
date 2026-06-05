'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Đăng nhập thất bại');
            } else if (data.user.role !== 'ADMIN') {
                setError('Tài khoản này không có quyền truy cập Admin.');
            } else {
                router.push('/admin/dashboard');
                router.refresh();
            }
        } catch {
            setError('Không thể kết nối đến máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { color: 'bg-indigo-400', label: 'Quản lý người dùng' },
        { color: 'bg-emerald-400', label: 'Duyệt doanh nghiệp' },
        { color: 'bg-amber-400', label: 'Kiểm duyệt tin đăng' },
        { color: 'bg-pink-400', label: 'Thống kê & Báo cáo' },
    ];

    const stats = [
        { num: '25', label: 'Doanh nghiệp' },
        { num: '100', label: 'Tin đăng' },
        { num: '70+', label: 'Ứng viên' },
    ];

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_480px] bg-[#070a14] font-sans">

            {/* ── LEFT ── */}
            <div className="relative hidden lg:flex flex-col justify-center px-20 py-16 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_50%,rgba(99,102,241,0.18),transparent)] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_80%_20%,rgba(16,185,129,0.10),transparent)] pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

                <div className="relative z-10">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-16">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center text-xl shadow-[0_0_24px_rgba(99,102,241,0.4)]">
                            🛡️
                        </div>
                        <span className="text-white font-bold text-lg tracking-tight">
                            Phú Quốc<span className="text-indigo-400">Jobs</span>
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl font-extrabold text-white leading-[1.05] tracking-tight mb-5">
                        Trung tâm<br />
                        <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                            quản trị
                        </span><br />
                        hệ thống
                    </h1>

                    <p className="text-white/40 text-[15px] leading-relaxed max-w-sm mb-14 font-light">
                        Nền tảng tuyển dụng hàng đầu tại đảo Ngọc. Quản lý toàn bộ hoạt động — từ duyệt doanh nghiệp đến thống kê thị trường lao động.
                    </p>

                    <div className="grid grid-cols-2 gap-3 max-w-[420px]">
                        {features.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:border-indigo-400/30 transition-colors">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.color}`} />
                                <span className="text-white/60 text-sm">{f.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── RIGHT ── */}
            <div className="relative flex flex-col justify-center px-12 py-16 bg-white/[0.025] border-l border-white/[0.06] backdrop-blur-xl">

                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-3.5 py-1.5 mb-6">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)] animate-pulse" />
                        <span className="text-indigo-400 text-[11px] font-semibold tracking-widest uppercase">
                            Quản trị viên
                        </span>
                    </div>
                    <h2 className="text-white text-2xl font-bold tracking-tight mb-1.5">
                        Đăng nhập hệ thống
                    </h2>
                    <p className="text-white/35 text-sm font-light">
                        Chỉ tài khoản ADMIN mới có quyền truy cập
                    </p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-5">
                    {error && (
                        <div className="flex items-center gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-4 py-3 text-red-300 text-sm">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-white/45 mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none">✉</span>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@phuquocjobs.vn"
                                required
                                className="w-full pl-10 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/20 outline-none focus:border-indigo-400/50 focus:bg-indigo-500/[0.06] focus:ring-2 focus:ring-indigo-500/[0.08] transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-white/45 mb-2">
                            Mật khẩu
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none">🔑</span>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full pl-10 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/20 outline-none focus:border-indigo-400/50 focus:bg-indigo-500/[0.06] focus:ring-2 focus:ring-indigo-500/[0.08] transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="relative mt-1 w-full py-3.5 rounded-xl font-bold text-[15px] text-white bg-gradient-to-r from-indigo-500 to-indigo-400 shadow-[0_4px_24px_rgba(99,102,241,0.35)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.45)] hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all overflow-hidden"
                    >
                        {loading ? 'Đang xác thực...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className="flex items-center gap-3.5 my-7">
                    <div className="flex-1 h-px bg-white/[0.07]" />
                    <span className="text-xs text-white/25">hoặc</span>
                    <div className="flex-1 h-px bg-white/[0.07]" />
                </div>

                <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.07] text-white/35 text-sm hover:text-white/70 hover:border-white/15 hover:bg-white/[0.04] transition-all"
                >
                    ← Quay về trang đăng nhập thường
                </Link>

                {/* Stats */}
                <div className="absolute bottom-8 left-12 right-12 grid grid-cols-3 gap-3">
                    {stats.map((s, i) => (
                        <div key={i} className="text-center py-3 px-2 bg-white/[0.03] border border-white/[0.05] rounded-xl">
                            <div className="text-white font-bold text-lg leading-none">{s.num}</div>
                            <div className="text-white/30 text-[11px] mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}