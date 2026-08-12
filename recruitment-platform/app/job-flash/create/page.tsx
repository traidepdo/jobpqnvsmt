"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Category {
    id: string;
    name: string;
}

interface Ward {
    id: string;
    name: string;
    district?: {
        name: string;
    };
}

export default function JobFlashCreate() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [loadingMeta, setLoadingMeta] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        categoryId: "",
        description: "",
        requirements: "",
        benefits: "",
        quantity: 1,
        salaryMin: "",
        salaryMax: "",
        wardId: "",
        addressDetail: "",
        type: "FULL_TIME",
        experience: "NO_EXPERIENCE",
        level: "STAFF",
        deadline: "",
    });

    useEffect(() => {
        async function fetchMeta() {
            try {
                const res = await fetch("/api/public/meta");
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data.categories || []);
                    setWards(data.wards || []);
                    if (data.categories?.length > 0) {
                        setFormData((prev) => ({ ...prev, categoryId: data.categories[0].id }));
                    }
                }
            } catch (err) {
                console.error("Lỗi lấy danh mục meta:", err);
            } finally {
                setLoadingMeta(false);
            }
        }
        fetchMeta();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!formData.title.trim()) {
            setErrorMsg("Vui lòng nhập tiêu đề tuyển dụng");
            return;
        }
        if (!formData.categoryId) {
            setErrorMsg("Vui lòng chọn ngành nghề");
            return;
        }
        if (!formData.description.trim()) {
            setErrorMsg("Vui lòng nhập mô tả công việc");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/flash-job", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    quantity: Number(formData.quantity) || 1,
                    salaryMin: formData.salaryMin ? Number(formData.salaryMin) : null,
                    salaryMax: formData.salaryMax ? Number(formData.salaryMax) : null,
                    deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Tạo tin Flash thất bại");
            }

            alert("⚡ Đăng tin Flash thành công!");
            router.push("/job-flash");
            router.refresh();
        } catch (err: any) {
            setErrorMsg(err.message || "Đã xảy ra lỗi khi tạo tin tuyển dụng");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 font-sans">
            {/* Header / Breadcrumb */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link
                        href="/job-flash"
                        className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
                    >
                        <span className="material-symbols-outlined text-base mr-1">arrow_back</span>
                        Quay lại Job Flash
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                        Đăng Tin Tuyển Dụng Flash
                        <span className="material-symbols-outlined text-3xl text-amber-500 animate-pulse">
                            bolt
                        </span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Đăng tin tuyển nhanh siêu tốc dành cho Ứng viên / Nhà tuyển dụng
                    </p>
                </div>
            </div>

            {/* Form Container */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl shadow-slate-100">
                {errorMsg && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
                        <span className="material-symbols-outlined text-rose-500">error</span>
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tiêu đề & Ngành nghề */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Tiêu đề công việc <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Ví dụ: Phục vụ bàn ca tối, Lập trình viên ReactJS..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Ngành nghề <span className="text-rose-500">*</span>
                            </label>
                            {loadingMeta ? (
                                <div className="h-11 bg-slate-100 rounded-xl animate-pulse" />
                            ) : (
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer transition-all"
                                    required
                                >
                                    <option value="">-- Chọn ngành nghề --</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Mức lương Min - Max */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Lương tối thiểu (VNĐ)
                            </label>
                            <input
                                type="number"
                                name="salaryMin"
                                value={formData.salaryMin}
                                onChange={handleChange}
                                placeholder="Ví dụ: 7000000"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Lương tối đa (VNĐ)
                            </label>
                            <input
                                type="number"
                                name="salaryMax"
                                value={formData.salaryMax}
                                onChange={handleChange}
                                placeholder="Ví dụ: 12000000"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Số lượng tuyển
                            </label>
                            <input
                                type="number"
                                name="quantity"
                                min={1}
                                value={formData.quantity}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Hình thức làm việc & Kinh nghiệm & Hạn nộp */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Hình thức làm việc
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer transition-all"
                            >
                                <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
                                <option value="PART_TIME">Bán thời gian (Part-time)</option>
                                <option value="INTERNSHIP">Thực tập (Internship)</option>
                                <option value="CONTRACT">Hợp đồng (Contract)</option>
                                <option value="TEMPORARY">Thời vụ (Temporary)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Yêu cầu kinh nghiệm
                            </label>
                            <select
                                name="experience"
                                value={formData.experience}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer transition-all"
                            >
                                <option value="NO_EXPERIENCE">Không yêu cầu kinh nghiệm</option>
                                <option value="UNDER_1_YEAR">Dưới 1 năm</option>
                                <option value="ONE_TO_TWO_YEARS">1 - 2 năm</option>
                                <option value="TWO_TO_FIVE_YEARS">2 - 5 năm</option>
                                <option value="OVER_5_YEARS">Trên 5 năm</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Hạn nhận hồ sơ
                            </label>
                            <input
                                type="date"
                                name="deadline"
                                value={formData.deadline}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Địa điểm (Phường / Xã & Chi tiết) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Khu vực (Phường/Xã)
                            </label>
                            {loadingMeta ? (
                                <div className="h-11 bg-slate-100 rounded-xl animate-pulse" />
                            ) : (
                                <select
                                    name="wardId"
                                    value={formData.wardId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer transition-all"
                                >
                                    <option value="">-- Chọn Phường / Xã --</option>
                                    {wards.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.name} {w.district ? `(${w.district.name})` : ""}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Địa chỉ chi tiết
                            </label>
                            <input
                                type="text"
                                name="addressDetail"
                                value={formData.addressDetail}
                                onChange={handleChange}
                                placeholder="Số nhà, đường..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Mô tả công việc */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Mô tả công việc <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            name="description"
                            rows={4}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Mô tả chi tiết các công việc cần thực hiện..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Yêu cầu công việc */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Yêu cầu ứng viên
                        </label>
                        <textarea
                            name="requirements"
                            rows={3}
                            value={formData.requirements}
                            onChange={handleChange}
                            placeholder="Kỹ năng, bằng cấp hoặc yêu cầu cần thiết..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                        />
                    </div>

                    {/* Quyền lợi */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Quyền lợi & Chế độ
                        </label>
                        <textarea
                            name="benefits"
                            rows={3}
                            value={formData.benefits}
                            onChange={handleChange}
                            placeholder="Thưởng, phụ cấp, chế độ đãi ngộ..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 flex justify-end gap-4">
                        <Link
                            href="/job-flash"
                            className="px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                        >
                            Hủy bỏ
                        </Link>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-xl">bolt</span>
                            <span>{submitting ? "Đang đăng..." : "Đăng Tin Flash Ngay"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}