"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CategoryForm() {
    const router = useRouter()
    const [name, setName] = useState("")
    const [icon, setIcon] = useState("")
    const [slug, setSlug] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const generateSlug = (value: string) => {
        return value
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setName(value)
        if (!slug || slug === generateSlug(name)) {
            setSlug(generateSlug(value))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        try {
            const res = await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, icon, slug }),
            })
            if (res.ok) {
                router.push("/admin/categories")
                router.refresh()
            } else {
                const data = await res.json()
                setError(data.message || "Đã xảy ra lỗi. Vui lòng thử lại.")
            }
        } catch {
            setError("Không thể kết nối đến máy chủ.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0f1117] text-white p-8">
            {/* Header breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
                <span className="text-gray-500">Danh mục</span>
                <span className="text-gray-600">/</span>
                <span className="text-white font-medium">Thêm danh mục</span>
            </div>

            {/* Page title */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Thêm danh mục mới</h1>
                <p className="text-gray-400 text-sm mt-1">Điền đầy đủ thông tin để tạo danh mục mới</p>
            </div>

            {/* Form Card */}
            <div className="bg-[#161b27] border border-[#232a3b] rounded-xl p-6 max-w-xl shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Tên danh mục */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Tên danh mục <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            placeholder="VD: Công nghệ thông tin"
                            className="w-full px-3.5 py-2.5 bg-[#0f1117] border border-[#2a3147] rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                            required
                        />
                    </div>

                    {/* Icon */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Icon <span className="text-red-400">*</span>
                        </label>
                        <div className="flex gap-3 items-center">
                            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#0f1117] border border-[#2a3147] text-xl shrink-0">
                                {icon || <span className="text-gray-600 text-base">?</span>}
                            </div>
                            <input
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                placeholder="Nhập emoji hoặc mã Font Awesome (vd: 💻)"
                                className="flex-1 px-3.5 py-2.5 bg-[#0f1117] border border-[#2a3147] rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">Nhập emoji trực tiếp hoặc class Font Awesome (fa-briefcase)</p>
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Slug <span className="text-red-400">*</span>
                        </label>
                        <div className="flex items-center bg-[#0f1117] border border-[#2a3147] rounded-lg overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition">
                            <span className="px-3 py-2.5 text-sm text-gray-500 border-r border-[#2a3147] shrink-0 select-none">
                                /danh-muc/
                            </span>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="ten-danh-muc"
                                className="flex-1 px-3.5 py-2.5 bg-transparent text-white placeholder-gray-600 text-sm focus:outline-none"
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">Tự động tạo từ tên danh mục. Chỉ dùng chữ thường, số và dấu gạch ngang.</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3.5 py-2.5">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {loading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Lưu danh mục
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-5 py-2.5 bg-transparent border border-[#2a3147] hover:border-[#3a4157] text-gray-400 hover:text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Huỷ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}