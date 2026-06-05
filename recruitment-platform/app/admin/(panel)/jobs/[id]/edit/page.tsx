'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Meta {
    categories: { id: string; name: string }[];
    companies: { id: string; name: string }[];
    wards: { id: string; name: string }[];
}

interface FormValues {
    title: string;
    description: string;
    requirements: string;
    benefits: string;
    quantity: string;
    salaryMin: string;
    salaryMax: string;
    addressDetail: string;
    wardId: string;
    type: string;
    experience: string;
    level: string;
    status: string;
    deadline: string;
    categoryId: string;
    companyId: string;
}

type ToastType = 'success' | 'error';
interface Toast { message: string; type: ToastType; }

export default function AdminEditJobPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [meta, setMeta] = useState<Meta>({ categories: [], companies: [], wards: [] });
    const [form, setForm] = useState<FormValues | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<Toast | null>(null);

    useEffect(() => {
        // Fetch meta and job detail concurrently
        Promise.all([
            fetch('/api/admin/jobs/meta').then(r => r.json()),
            fetch(`/api/admin/jobs/${id}`).then(r => r.json())
        ]).then(([metaData, jobData]) => {
            if (metaData) {
                setMeta({
                    categories: metaData.categories || [],
                    companies: metaData.companies || [],
                    wards: metaData.wards || [],
                });
            }
            if (jobData && jobData.job) {
                const j = jobData.job;
                setForm({
                    title: j.title || '',
                    description: j.description || '',
                    requirements: j.requirements || '',
                    benefits: j.benefits || '',
                    quantity: String(j.quantity || 1),
                    salaryMin: j.salaryMin != null ? String(j.salaryMin) : '',
                    salaryMax: j.salaryMax != null ? String(j.salaryMax) : '',
                    addressDetail: j.addressDetail || '',
                    wardId: j.wardId || '',
                    type: j.type || 'FULL_TIME',
                    experience: j.experience || '',
                    level: j.level || '',
                    status: j.status || 'PENDING',
                    deadline: j.deadline ? j.deadline.slice(0, 10) : '',
                    categoryId: j.categoryId || '',
                    companyId: j.companyId || '',
                });
            } else {
                showToast('Không thể tải thông tin tin tuyển dụng', 'error');
            }
        }).catch(err => {
            console.error(err);
            showToast('Lỗi tải dữ liệu', 'error');
        }).finally(() => {
            setLoading(false);
        });
    }, [id]);

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleFieldChange = (key: keyof FormValues, val: string) => {
        setForm(prev => prev ? { ...prev, [key]: val } : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form) return;
        setSaving(true);
        try {
            // Build the payload
            const payload = {
                title: form.title,
                description: form.description,
                requirements: form.requirements || null,
                benefits: form.benefits || null,
                quantity: parseInt(form.quantity) || 1,
                salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null,
                salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null,
                addressDetail: form.addressDetail || null,
                wardId: form.wardId || null,
                type: form.type,
                experience: form.experience || null,
                level: form.level || null,
                status: form.status,
                deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
                categoryId: form.categoryId,
                companyId: form.companyId,
            };

            const res = await fetch(`/api/admin/jobs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update job');
            }

            showToast('Đã lưu các thay đổi thành công!', 'success');
            setTimeout(() => router.push(`/admin/jobs/${id}`), 1200);
        } catch (err: any) {
            console.error(err);
            showToast(err.message || 'Lỗi cập nhật tin tuyển dụng', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                <div className="w-10 h-10 border-[3px] border-white/10 border-t-indigo-500 rounded-full animate-spin mb-4" />
                <span>Đang tải thông tin chỉnh sửa...</span>
            </div>
        );
    }

    if (!form) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400 mb-6">Không thể tải dữ liệu form.</p>
                <Link href="/admin/jobs" className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/8 text-white rounded-xl text-sm font-medium transition-colors">
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    const inputCls = "w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl outline-none text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:bg-white/8 transition-colors";
    const textareaCls = "w-full p-3 bg-white/5 border border-white/10 rounded-xl outline-none text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:bg-white/8 resize-none transition-colors";
    const labelCls = "block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide";

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-white/50">
                <Link href="/admin/jobs" className="hover:text-white transition-colors">Tin tuyển dụng</Link>
                <span>/</span>
                <Link href={`/admin/jobs/${id}`} className="hover:text-white transition-colors truncate max-w-[150px]">{form.title}</Link>
                <span>/</span>
                <span className="text-white/80">Chỉnh sửa</span>
            </div>

            {/* Header Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white">Chỉnh sửa tin tuyển dụng</h1>
                    <p className="text-xs text-white/40 mt-1">Cập nhật đầy đủ chi tiết tin, quyền lợi và yêu cầu công việc.</p>
                </div>
                <Link
                    href={`/admin/jobs/${id}`}
                    className="px-4 py-2 bg-white/5 hover:bg-white/8 border border-white/10 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                    Hủy & Quay lại
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Basic Info */}
                <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                    <h3 className="font-bold text-white text-sm border-l-4 border-indigo-500 pl-3 mb-2">Thông tin cơ bản</h3>
                    
                    <div>
                        <label className={labelCls}>Tiêu đề tuyển dụng *</label>
                        <input
                            className={inputCls}
                            value={form.title}
                            onChange={e => handleFieldChange('title', e.target.value)}
                            required
                            placeholder="VD: Nhân viên lễ tân khách sạn"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Nhà tuyển dụng / Doanh nghiệp *</label>
                            <select
                                className={inputCls}
                                value={form.companyId}
                                onChange={e => handleFieldChange('companyId', e.target.value)}
                                required
                            >
                                <option value="" className="bg-[#0f1420]">Chọn doanh nghiệp</option>
                                {meta.companies.map(c => (
                                    <option key={c.id} value={c.id} className="bg-[#0f1420]">{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Ngành nghề / Danh mục *</label>
                            <select
                                className={inputCls}
                                value={form.categoryId}
                                onChange={e => handleFieldChange('categoryId', e.target.value)}
                                required
                            >
                                <option value="" className="bg-[#0f1420]">Chọn ngành nghề</option>
                                {meta.categories.map(c => (
                                    <option key={c.id} value={c.id} className="bg-[#0f1420]">{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. Salary & Location */}
                <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                    <h3 className="font-bold text-white text-sm border-l-4 border-indigo-500 pl-3 mb-2">Lương & Địa điểm</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelCls}>Lương tối thiểu (Triệu VNĐ)</label>
                            <input
                                type="number"
                                className={inputCls}
                                value={form.salaryMin}
                                onChange={e => handleFieldChange('salaryMin', e.target.value)}
                                placeholder="Để trống nếu thỏa thuận"
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Lương tối đa (Triệu VNĐ)</label>
                            <input
                                type="number"
                                className={inputCls}
                                value={form.salaryMax}
                                onChange={e => handleFieldChange('salaryMax', e.target.value)}
                                placeholder="Để trống nếu thỏa thuận"
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Số lượng tuyển dụng *</label>
                            <input
                                type="number"
                                min={1}
                                className={inputCls}
                                value={form.quantity}
                                onChange={e => handleFieldChange('quantity', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Khu vực làm việc *</label>
                            <select
                                className={inputCls}
                                value={form.wardId}
                                onChange={e => handleFieldChange('wardId', e.target.value)}
                                required
                            >
                                <option value="" className="bg-[#0f1420]">Chọn phường xã</option>
                                {meta.wards.map(w => (
                                    <option key={w.id} value={w.id} className="bg-[#0f1420]">{w.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Hạn nộp hồ sơ</label>
                            <input
                                type="date"
                                className={inputCls}
                                value={form.deadline}
                                onChange={e => handleFieldChange('deadline', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Địa chỉ chi tiết</label>
                        <input
                            className={inputCls}
                            value={form.addressDetail}
                            onChange={e => handleFieldChange('addressDetail', e.target.value)}
                            placeholder="Số nhà, tên đường..."
                        />
                    </div>
                </div>

                {/* 3. Job attributes */}
                <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                    <h3 className="font-bold text-white text-sm border-l-4 border-indigo-500 pl-3 mb-2">Đặc tính công việc</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Hình thức làm việc</label>
                            <select
                                className={inputCls}
                                value={form.type}
                                onChange={e => handleFieldChange('type', e.target.value)}
                            >
                                <option value="FULL_TIME" className="bg-[#0f1420]">Toàn thời gian</option>
                                <option value="PART_TIME" className="bg-[#0f1420]">Bán thời gian</option>
                                <option value="CONTRACT" className="bg-[#0f1420]">Hợp đồng</option>
                                <option value="INTERNSHIP" className="bg-[#0f1420]">Thực tập</option>
                                <option value="REMOTE" className="bg-[#0f1420]">Làm từ xa</option>
                                <option value="FREELANCE" className="bg-[#0f1420]">Tự do</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Trạng thái tuyển dụng</label>
                            <select
                                className={inputCls}
                                value={form.status}
                                onChange={e => handleFieldChange('status', e.target.value)}
                            >
                                <option value="ACTIVE" className="bg-[#0f1420]">Đang hoạt động (Đang tuyển)</option>
                                <option value="PENDING" className="bg-[#0f1420]">Chờ duyệt</option>
                                <option value="DRAFT" className="bg-[#0f1420]">Bản nháp</option>
                                <option value="CLOSED" className="bg-[#0f1420]">Đã đóng tin</option>
                                <option value="REJECTED" className="bg-[#0f1420]">Từ chối duyệt</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Kinh nghiệm yêu cầu</label>
                            <select
                                className={inputCls}
                                value={form.experience}
                                onChange={e => handleFieldChange('experience', e.target.value)}
                            >
                                <option value="" className="bg-[#0f1420]">Không yêu cầu</option>
                                <option value="NO_EXPERIENCE" className="bg-[#0f1420]">Không kinh nghiệm</option>
                                <option value="UNDER_1_YEAR" className="bg-[#0f1420]">Dưới 1 năm</option>
                                <option value="ONE_TO_THREE_YEARS" className="bg-[#0f1420]">1 - 3 năm</option>
                                <option value="THREE_TO_FIVE_YEARS" className="bg-[#0f1420]">3 - 5 năm</option>
                                <option value="OVER_FIVE_YEARS" className="bg-[#0f1420]">Trên 5 năm</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Cấp bậc tuyển dụng</label>
                            <select
                                className={inputCls}
                                value={form.level}
                                onChange={e => handleFieldChange('level', e.target.value)}
                            >
                                <option value="" className="bg-[#0f1420]">—</option>
                                <option value="INTERN" className="bg-[#0f1420]">Thực tập sinh</option>
                                <option value="FRESHER" className="bg-[#0f1420]">Mới tốt nghiệp (Fresher)</option>
                                <option value="JUNIOR" className="bg-[#0f1420]">Junior</option>
                                <option value="MID" className="bg-[#0f1420]">Mid-level</option>
                                <option value="SENIOR" className="bg-[#0f1420]">Senior</option>
                                <option value="LEAD" className="bg-[#0f1420]">Lead</option>
                                <option value="MANAGER" className="bg-[#0f1420]">Trưởng phòng (Manager)</option>
                                <option value="DIRECTOR" className="bg-[#0f1420]">Giám đốc (Director)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 4. Text Descriptions */}
                <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                    <h3 className="font-bold text-white text-sm border-l-4 border-indigo-500 pl-3 mb-2">Mô tả chi tiết tuyển dụng</h3>
                    
                    <div>
                        <label className={labelCls}>Mô tả công việc *</label>
                        <textarea
                            className={textareaCls}
                            rows={6}
                            value={form.description}
                            onChange={e => handleFieldChange('description', e.target.value)}
                            required
                            placeholder="Mô tả cụ thể nhiệm vụ hàng ngày..."
                        />
                    </div>

                    <div>
                        <label className={labelCls}>Yêu cầu ứng viên</label>
                        <textarea
                            className={textareaCls}
                            rows={4}
                            value={form.requirements}
                            onChange={e => handleFieldChange('requirements', e.target.value)}
                            placeholder="Yêu cầu về kinh nghiệm, kỹ năng..."
                        />
                    </div>

                    <div>
                        <label className={labelCls}>Quyền lợi ứng viên</label>
                        <textarea
                            className={textareaCls}
                            rows={4}
                            value={form.benefits}
                            onChange={e => handleFieldChange('benefits', e.target.value)}
                            placeholder="Bảo hiểm, thưởng, trợ cấp..."
                        />
                    </div>
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-3">
                    <Link
                        href={`/admin/jobs/${id}`}
                        className="px-6 py-3 bg-white/5 hover:bg-white/8 border border-white/10 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                        Hủy
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 disabled:opacity-75 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-lg shadow-indigo-600/25"
                    >
                        {saving ? 'Đang lưu trữ...' : 'Lưu các thay đổi'}
                    </button>
                </div>
            </form>

            {/* Toast alert */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl text-white border ${
                    toast.type === 'success' ? 'bg-emerald-600/90 border-emerald-500/50' : 'bg-red-600/90 border-red-500/50'
                }`}>
                    {toast.type === 'success' ? '✓' : '✕'} {toast.message}
                </div>
            )}
        </div>
    );
}
