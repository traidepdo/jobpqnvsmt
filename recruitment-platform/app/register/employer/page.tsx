'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step = 1 | 2;

const COMPANY_SIZES = [
    { value: 'SMALL', label: '1 - 50 NV', icon: 'groups' },
    { value: 'MEDIUM', label: '51 - 200 NV', icon: 'domain' },
    { value: 'LARGE', label: '201 - 500 NV', icon: 'business' },
    { value: 'ENTERPRISE', label: '500+ NV', icon: 'corporate_fare' },
];

const INDUSTRIES = [
    'Công nghệ thông tin', 'Du lịch & Khách sạn', 'Nhà hàng & Ẩm thực',
    'Bất động sản', 'Tài chính & Ngân hàng', 'Y tế & Sức khỏe',
    'Giáo dục & Đào tạo', 'Xây dựng', 'Thương mại điện tử', 'Khác',
];

export default function RegisterEmployerPage() {
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        companyName: '', companyWebsite: '', companyDescription: '',
        companySize: '', industry: '',
    });

    const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp!');
            return;
        }
        if (form.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự!');
            return;
        }
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register-employer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    companyName: form.companyName,
                    companyWebsite: form.companyWebsite,
                    companyDescription: form.companyDescription,
                    companySize: form.companySize || undefined,
                    industry: form.industry,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Đăng ký thất bại');
            } else {
                router.push('/login?registered=employer');
            }
        } catch {
            setError('Không thể kết nối đến máy chủ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
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
                
                .ken-burns-bg {
                    animation: kenBurns 35s ease-in-out infinite alternate;
                }

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
                
                input:-webkit-autofill, select:-webkit-autofill, textarea:-webkit-autofill {
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

                {/* Header Topbar */}
                <header className="absolute top-0 left-0 right-0 px-6 md:px-12 py-4 flex items-center justify-between z-50">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <span className="font-extrabold text-2xl tracking-tight text-white">
                            Phú Quốc<span className="text-emerald-400">Jobs</span>
                        </span>
                    </Link>
                    <span className="text-slate-300 text-xs">
                        Đã có tài khoản?{' '}
                        <Link href="/login" className="text-emerald-400 font-bold hover:underline transition-colors">
                            Đăng nhập
                        </Link>
                    </span>
                </header>

                {/* Form Wrapper Container (No Scroll) */}
                <div className="relative z-10 w-full max-w-[580px] bg-black/45 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/40 p-6 md:p-8 anim-fade-up flex flex-col justify-between my-auto max-h-[90vh]">
                    <div>
                        {/* Header Banner info */}
                        <div className="mb-5 border-b border-white/10 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-xl font-extrabold text-white tracking-tight">Đăng ký Doanh nghiệp</h1>
                                    <p className="text-slate-300 text-xs mt-0.5">Tìm kiếm nhân sự hàng đầu tại Phú Quốc</p>
                                </div>
                                <div className="text-3xl">🏢</div>
                            </div>

                            {/* Step progress indicators */}
                            <div className="flex items-center gap-4 mt-4">
                                {[1, 2].map((s) => (
                                    <div key={s} className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                                            step >= s 
                                                ? 'bg-emerald-500 text-white' 
                                                : 'bg-white/10 text-slate-400 border border-white/5'
                                        }`}>
                                            {step > s ? '✓' : s}
                                        </div>
                                        <span className={`text-xs font-bold transition-all duration-300 ${
                                            step === s ? 'text-white' : 'text-slate-400'
                                        }`}>
                                            {s === 1 ? 'Tài khoản' : 'Hồ sơ doanh nghiệp'}
                                        </span>
                                        {s < 2 && <span className="text-white/20 text-xs">➔</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-4 flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs p-3.5 rounded-xl anim-fade-up shadow-sm">
                                <span className="material-symbols-outlined text-[18px] shrink-0 text-rose-400">error</span>
                                <div>
                                    <p className="font-semibold">Đã xảy ra lỗi</p>
                                    <p className="text-[10px] text-rose-300 mt-0.5">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Form Body */}
                        {step === 1 ? (
                            <form onSubmit={handleNextStep} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Họ và tên *</label>
                                        <div className="flex items-center bg-black/20 rounded-xl px-3.5 py-2.5 border border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-300">
                                            <span className="material-symbols-outlined text-slate-400 mr-2 shrink-0 text-[16px]">person</span>
                                            <input
                                                type="text"
                                                value={form.name}
                                                onChange={e => set('name', e.target.value)}
                                                required
                                                placeholder="Nguyễn Văn A"
                                                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Email công việc *</label>
                                        <div className="flex items-center bg-black/20 rounded-xl px-3.5 py-2.5 border border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-300">
                                            <span className="material-symbols-outlined text-slate-400 mr-2 shrink-0 text-[16px]">mail</span>
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={e => set('email', e.target.value)}
                                                required
                                                placeholder="hr@company.com"
                                                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Mật khẩu *</label>
                                        <div className="flex items-center bg-black/20 rounded-xl px-3.5 py-2.5 border border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-300">
                                            <span className="material-symbols-outlined text-slate-400 mr-2 shrink-0 text-[16px]">lock</span>
                                            <input
                                                type="password"
                                                value={form.password}
                                                onChange={e => set('password', e.target.value)}
                                                required
                                                placeholder="Tối thiểu 6 ký tự"
                                                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Xác nhận mật khẩu *</label>
                                        <div className="flex items-center bg-black/20 rounded-xl px-3.5 py-2.5 border border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-300">
                                            <span className="material-symbols-outlined text-slate-400 mr-2 shrink-0 text-[16px]">verified_user</span>
                                            <input
                                                type="password"
                                                value={form.confirmPassword}
                                                onChange={e => set('confirmPassword', e.target.value)}
                                                required
                                                placeholder="Nhập lại mật khẩu"
                                                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex gap-2.5 text-emerald-300 text-xs">
                                    <span className="material-symbols-outlined text-emerald-400 text-[18px] shrink-0">info</span>
                                    <div>
                                        Tài khoản nhà tuyển dụng cần được <strong className="text-white font-bold">quản trị viên phê duyệt</strong> trước khi tin tuyển dụng hiển thị công khai.
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="shimmer-btn w-full py-3.5 rounded-xl font-bold text-white text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 hover:scale-[1.01] shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <span>Thiết lập hồ sơ doanh nghiệp</span>
                                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Tên doanh nghiệp *</label>
                                    <div className="flex items-center bg-black/20 rounded-xl px-3.5 py-2.5 border border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-300">
                                        <span className="material-symbols-outlined text-slate-400 mr-2 shrink-0 text-[16px]">domain</span>
                                        <input
                                            type="text"
                                            value={form.companyName}
                                            onChange={e => set('companyName', e.target.value)}
                                            required
                                            placeholder="Công ty TNHH ABC"
                                            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Địa chỉ Website</label>
                                        <div className="flex items-center bg-black/20 rounded-xl px-3.5 py-2.5 border border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-300">
                                            <span className="material-symbols-outlined text-slate-400 mr-2 shrink-0 text-[16px]">language</span>
                                            <input
                                                type="url"
                                                value={form.companyWebsite}
                                                onChange={e => set('companyWebsite', e.target.value)}
                                                placeholder="https://company.vn"
                                                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none w-full"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Lĩnh vực hoạt động</label>
                                        <div className="flex items-center bg-black/20 rounded-xl px-3.5 py-2.5 border border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-300">
                                            <span className="material-symbols-outlined text-slate-400 mr-2 shrink-0 text-[16px]">category</span>
                                            <select
                                                value={form.industry}
                                                onChange={e => set('industry', e.target.value)}
                                                className="flex-1 bg-transparent text-xs text-white outline-none w-full appearance-none cursor-pointer"
                                                style={{ colorScheme: 'dark' }}
                                            >
                                                <option value="" className="bg-slate-900">Chọn lĩnh vực chính</option>
                                                {INDUSTRIES.map(ind => (
                                                    <option key={ind} value={ind} className="bg-slate-900">{ind}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Quy mô công ty</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {COMPANY_SIZES.map(s => (
                                            <label 
                                                key={s.value} 
                                                className={`flex items-center gap-2 p-2 rounded-xl border transition-all duration-300 cursor-pointer ${
                                                    form.companySize === s.value 
                                                        ? 'border-emerald-500 bg-emerald-500/10' 
                                                        : 'border-white/10 bg-transparent hover:bg-white/[0.04]'
                                                }`}
                                            >
                                                <input 
                                                    type="radio" 
                                                    name="companySize" 
                                                    value={s.value}
                                                    checked={form.companySize === s.value}
                                                    onChange={e => set('companySize', e.target.value)}
                                                    className="accent-emerald-500 w-3.5 h-3.5 shrink-0" 
                                                />
                                                <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0">{s.icon}</span>
                                                <span className="text-[10px] font-semibold text-slate-300">{s.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Giới thiệu ngắn doanh nghiệp</label>
                                    <div className="bg-black/20 rounded-xl border border-white/10 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-300 p-2.5">
                                        <textarea
                                            rows={2}
                                            value={form.companyDescription}
                                            onChange={e => set('companyDescription', e.target.value)}
                                            placeholder="Mô tả ngắn về doanh nghiệp của bạn..."
                                            className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none resize-none leading-relaxed"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(1)} 
                                        className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-white/[0.06] hover:bg-white/[0.12] hover:text-white transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer text-xs"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                                        <span>Quay lại</span>
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={loading} 
                                        className="shimmer-btn flex-[2] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 hover:scale-[1.01] shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-1">
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                Đang xử lý...
                                            </span>
                                        ) : (
                                            <>
                                                <span>Hoàn tất đăng ký</span>
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
