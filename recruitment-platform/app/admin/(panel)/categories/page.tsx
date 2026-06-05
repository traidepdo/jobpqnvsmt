"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    createdAt: string;
    updatedAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [page, setPage] = useState(1);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "10",
                ...(search && { search }),
            });
            const res = await fetch(`/api/admin/categories?${params}`);
            const json = await res.json();
            if (res.ok) {
                setCategories(json.data || []);
                setPagination(json.pagination || null);
            }
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Tìm kiếm khi nhấn Enter hoặc click nút
    const handleSearch = () => {
        setPage(1);
        setSearch(searchInput);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    const handleClearSearch = () => {
        setSearchInput("");
        setSearch("");
        setPage(1);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Xoá danh mục "${name}"?`)) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (!res.ok) {
                alert(json.error || "Xoá thất bại");
                return;
            }
            fetchCategories();
        } catch {
            alert("Lỗi kết nối");
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (str: string) =>
        new Date(str).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

    const startIndex = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
    const endIndex = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Danh mục</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {pagination ? `${pagination.total} danh mục` : "Quản lý danh mục việc làm"}
                    </p>
                </div>
                <Link
                    href="/admin/categories/new"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    + Thêm danh mục
                </Link>
            </div>

            {/* Search */}


            {/* Table */}
            <div className="border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-800/50 border-b border-gray-700">
                            <th className="text-left px-4 py-3 text-gray-400 font-medium w-8">#</th>
                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Tên danh mục</th>
                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Slug</th>
                            <th className="text-center px-4 py-3 text-gray-400 font-medium">Icon</th>
                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Ngày tạo</th>
                            <th className="text-left px-4 py-3 text-gray-400 font-medium">Cập nhật</th>
                            <th className="text-center px-4 py-3 text-gray-400 font-medium">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="text-center py-16 text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        <span>Đang tải...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : categories.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-16 text-gray-500">
                                    {search ? `Không tìm thấy danh mục nào cho "${search}"` : "Chưa có danh mục nào"}
                                </td>
                            </tr>
                        ) : (
                            categories.map((cat, index) => (
                                <tr
                                    key={cat.id}
                                    className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors"
                                >
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {startIndex + index}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-white">{cat.name}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                                            {cat.slug}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-xl">
                                        {cat.icon || <span className="text-gray-600 text-xs">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {formatDate(cat.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {formatDate(cat.updatedAt)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link
                                                href={`/admin/categories/${cat.id}/edit`}
                                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors"
                                            >
                                                Sửa
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(cat.id, cat.name)}
                                                disabled={deletingId === cat.id}
                                                className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-400 hover:text-red-300 rounded text-xs transition-colors disabled:opacity-50"
                                            >
                                                {deletingId === cat.id ? "..." : "Xoá"}
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
                        Hiển thị {startIndex}–{endIndex} / {pagination.total} danh mục
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                            className="px-2 py-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-40 hover:bg-gray-700 transition-colors text-xs"
                        >
                            «
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-40 hover:bg-gray-700 transition-colors"
                        >
                            ‹
                        </button>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                            .reduce<(number | "...")[]>((acc, p, i, arr) => {
                                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                p === "..." ? (
                                    <span key={`dots-${i}`} className="px-2 py-1 text-gray-600">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p as number)}
                                        className={`px-3 py-1 border rounded transition-colors ${p === page
                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                            : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                        <button
                            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                            disabled={page === pagination.totalPages}
                            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-40 hover:bg-gray-700 transition-colors"
                        >
                            ›
                        </button>
                        <button
                            onClick={() => setPage(pagination.totalPages)}
                            disabled={page === pagination.totalPages}
                            className="px-2 py-1 bg-gray-800 border border-gray-700 rounded disabled:opacity-40 hover:bg-gray-700 transition-colors text-xs"
                        >
                            »
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}