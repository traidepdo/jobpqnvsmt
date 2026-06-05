'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step = 1 | 2;

const COMPANY_SIZES = [
    { value: 'SMALL', label: '1 - 50 nhân viên' },
    { value: 'MEDIUM', label: '51 - 200 nhân viên' },
    { value: 'LARGE', label: '201 - 500 nhân viên' },
    { value: 'ENTERPRISE', label: '500+ nhân viên' },
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

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '12px 16px', boxSizing: 'border-box',
        border: '1.5px solid #e2e8f0', borderRadius: '10px',
        fontSize: '14px', color: '#0f172a', outline: 'none',
        fontFamily: 'inherit', background: 'white', transition: 'border-color 0.2s',
    };
    const labelStyle: React.CSSProperties = {
        display: 'block', marginBottom: '7px',
        fontSize: '13px', fontWeight: 600, color: '#374151',
    };

    return (
        <div style={{
            minHeight: '100vh', background: '#f8fafc',
            fontFamily: "'Inter', sans-serif",
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Top bar */}
            <div style={{
                background: 'white', borderBottom: '1px solid #e2e8f0',
                padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: '#0052CC' }}>🏝️ PhuQuocJobs</span>
                </Link>
                <span style={{ color: '#64748b', fontSize: '14px' }}>
                    Đã có tài khoản?{' '}
                    <Link href="/login" style={{ color: '#0052CC', fontWeight: 600, textDecoration: 'none' }}>
                        Đăng nhập
                    </Link>
                </span>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
                <div style={{
                    background: 'white', borderRadius: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
                    width: '100%', maxWidth: '600px', overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #10b981, #0d9488)',
                        padding: '32px 40px', color: 'white',
                    }}>
                        <div style={{ fontSize: '36px', marginBottom: '10px' }}>🏢</div>
                        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px' }}>
                            Đăng ký Doanh nghiệp
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: 0 }}>
                            Tạo tài khoản nhà tuyển dụng và thông tin công ty
                        </p>

                        {/* Step indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                            {[1, 2].map((s) => (
                                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: step >= s ? 'white' : 'rgba(255,255,255,0.3)',
                                        color: step >= s ? '#10b981' : 'rgba(255,255,255,0.7)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '13px', fontWeight: 700,
                                    }}>
                                        {step > s ? '✓' : s}
                                    </div>
                                    <span style={{
                                        fontSize: '13px', fontWeight: step === s ? 700 : 400,
                                        color: step === s ? 'white' : 'rgba(255,255,255,0.6)',
                                    }}>
                                        {s === 1 ? 'Thông tin tài khoản' : 'Thông tin công ty'}
                                    </span>
                                    {s < 2 && <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>→</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form body */}
                    <div style={{ padding: '36px 40px' }}>
                        {error && (
                            <div style={{
                                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
                                padding: '12px 16px', color: '#dc2626', fontSize: '14px',
                                marginBottom: '20px', textAlign: 'center',
                            }}>
                                {error}
                            </div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>Họ và tên *</label>
                                        <input style={inputStyle} type="text" value={form.name}
                                            onChange={e => set('name', e.target.value)} placeholder="Nguyễn Văn A" required />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Email *</label>
                                        <input style={inputStyle} type="email" value={form.email}
                                            onChange={e => set('email', e.target.value)} placeholder="hr@company.com" required />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>Mật khẩu *</label>
                                        <input style={inputStyle} type="password" value={form.password}
                                            onChange={e => set('password', e.target.value)} placeholder="Tối thiểu 6 ký tự" required />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Xác nhận mật khẩu *</label>
                                        <input style={inputStyle} type="password" value={form.confirmPassword}
                                            onChange={e => set('confirmPassword', e.target.value)} placeholder="Nhập lại mật khẩu" required />
                                    </div>
                                </div>
                                <div style={{
                                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                                    borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: '#15803d',
                                }}>
                                    💡 Tài khoản của bạn sẽ cần được <strong>quản trị viên phê duyệt</strong> trước khi có thể đăng tin tuyển dụng.
                                </div>
                                <button type="submit" style={{
                                    padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #10b981, #0d9488)',
                                    color: 'white', fontWeight: 700, fontSize: '15px',
                                    boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
                                }}>
                                    Tiếp theo →
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div>
                                    <label style={labelStyle}>Tên công ty *</label>
                                    <input style={inputStyle} type="text" value={form.companyName}
                                        onChange={e => set('companyName', e.target.value)} placeholder="Công ty TNHH ABC" required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>Website</label>
                                        <input style={inputStyle} type="url" value={form.companyWebsite}
                                            onChange={e => set('companyWebsite', e.target.value)} placeholder="https://company.vn" />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Lĩnh vực</label>
                                        <select style={{ ...inputStyle, appearance: 'none' }}
                                            value={form.industry} onChange={e => set('industry', e.target.value)}>
                                            <option value="">Chọn lĩnh vực</option>
                                            {INDUSTRIES.map(ind => (
                                                <option key={ind} value={ind}>{ind}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Quy mô công ty</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        {COMPANY_SIZES.map(s => (
                                            <label key={s.value} style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                                                border: form.companySize === s.value ? '2px solid #10b981' : '1.5px solid #e2e8f0',
                                                background: form.companySize === s.value ? '#f0fdf4' : 'white',
                                                transition: 'all 0.15s',
                                            }}>
                                                <input type="radio" name="companySize" value={s.value}
                                                    checked={form.companySize === s.value}
                                                    onChange={e => set('companySize', e.target.value)}
                                                    style={{ accentColor: '#10b981' }} />
                                                <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{s.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Giới thiệu công ty</label>
                                    <textarea
                                        rows={4}
                                        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                                        value={form.companyDescription}
                                        onChange={e => set('companyDescription', e.target.value)}
                                        placeholder="Mô tả về công ty, văn hóa, môi trường làm việc..."
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button type="button" onClick={() => setStep(1)} style={{
                                        flex: 1, padding: '14px', borderRadius: '10px',
                                        border: '1.5px solid #e2e8f0', background: 'white',
                                        color: '#374151', fontWeight: 600, fontSize: '15px', cursor: 'pointer',
                                    }}>
                                        ← Quay lại
                                    </button>
                                    <button type="submit" disabled={loading} style={{
                                        flex: 2, padding: '14px', borderRadius: '10px', border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        background: loading ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #0d9488)',
                                        color: 'white', fontWeight: 700, fontSize: '15px',
                                        boxShadow: loading ? 'none' : '0 4px 20px rgba(16,185,129,0.35)',
                                    }}>
                                        {loading ? 'Đang đăng ký...' : '🏢 Hoàn tất đăng ký'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
