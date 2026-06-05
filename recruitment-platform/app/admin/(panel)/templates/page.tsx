"use client";
// app/admin/templates/page.tsx
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { TemplateCategory } from "@prisma/client";

interface ResumeTemplate {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    thumbnailUrl: string | null;
    category: TemplateCategory;
    isActive: boolean;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
    BASIC: "Cơ bản",
    PROFESSIONAL: "Chuyên nghiệp",
    CREATIVE: "Sáng tạo",
    MODERN: "Hiện đại",
    ACADEMIC: "Học thuật",
};

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
    BASIC: "bg-gray-100 text-gray-700",
    PROFESSIONAL: "bg-blue-100 text-blue-700",
    CREATIVE: "bg-purple-100 text-purple-700",
    MODERN: "bg-green-100 text-green-700",
    ACADEMIC: "bg-amber-100 text-amber-700",
};

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<string>("");
    const [page, setPage] = useState(1);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "10",
                ...(search && { search }),
                ...(category && { category }),
            });
            const res = await fetch(`/api/admin/templates?${params}`);
            const json = await res.json();
            setTemplates(json.data || []);
            setPagination(json.pagination || null);
            console.log(params);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, search, category]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Xoá template "${name}"?`)) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/admin/templates/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (!res.ok) {
                alert(json.error || "Xoá thất bại");
                return;
            }
            fetchTemplates();
        } catch {
            alert("Lỗi kết nối");
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleActive = async (t: ResumeTemplate) => {
        try {
            await fetch(`/api/admin/templates/${t.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...t, isActive: !t.isActive }),
            });
            fetchTemplates();
        } catch {
            alert("Lỗi kết nối");
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Danh sách Mẫu CV</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Quản lý các template HTML/CSS cho CV ứng viên
                    </p>
                </div>
                <Link
                    href="/admin/templates/new"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <span>+ Thêm mẫu CV</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Tìm kiếm tên, mô tả..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
                <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                    <option value="">Tất cả loại</option>
                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-700 bg-gray-800/50">
                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Tên mẫu CV</th>
                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Loại</th>
                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Mô tả</th>
                            <th className="text-center px-4 py-3 text-gray-400 font-medium">Trạng thái</th>
                            <th className="text-center px-4 py-3 text-gray-400 font-medium">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-gray-500">
                                    Đang tải...
                                </td>
                            </tr>
                        ) : templates.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-gray-500">
                                    Chưa có mẫu CV nào
                                </td>
                            </tr>
                        ) : (
                            templates.map((t) => (
                                <tr key={t.id} className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {t.thumbnailUrl ? (
                                                <img
                                                    src={t.thumbnailUrl}
                                                    alt={t.name}
                                                    className="w-10 h-12 object-cover rounded border border-gray-700"
                                                />
                                            ) : (
                                                <div className="w-10 h-12 bg-gray-700 rounded border border-gray-600 flex items-center justify-center text-gray-500 text-xs">
                                                    CV
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-white">{t.name}</p>
                                                <p className="text-xs text-gray-500">{t.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[t.category]}`}>
                                            {CATEGORY_LABELS[t.category]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">
                                        {t.description || <span className="text-gray-600 italic">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleToggleActive(t)}
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${t.isActive
                                                ? "bg-green-900/50 text-green-400 hover:bg-green-900"
                                                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                                }`}
                                        >
                                            {t.isActive ? "Đang dùng" : "Ẩn"}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link
                                                href={`/admin/templates/${t.id}/edit`}
                                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                                            >
                                                Sửa
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(t.id, t.name)}
                                                disabled={deletingId === t.id}
                                                className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-400 hover:text-red-300 rounded text-xs transition-colors disabled:opacity-50"
                                            >
                                                {deletingId === t.id ? "..." : "Xoá"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                    <span>
                        Hiển thị {(pagination.page - 1) * pagination.limit + 1}–
                        {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} mẫu
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-40 hover:bg-gray-700 transition-colors"
                        >
                            ‹
                        </button>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`px-3 py-1 border rounded transition-colors ${p === page
                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                    : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                            disabled={page === pagination.totalPages}
                            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-40 hover:bg-gray-700 transition-colors"
                        >
                            ›
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}