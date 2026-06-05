'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Post {
    id: string; title: string; slug: string; excerpt: string | null;
    thumbnail: string | null; isPublished: boolean; views: number;
    createdAt: string; updatedAt: string;
    author: { id: string; name: string };
    category: { id: string; name: string } | null;
    _count: { tags: number };
}
interface Pagination {
    page: number; limit: number; total: number;
    totalPages: number; hasNext: boolean; hasPrev: boolean;
}
interface Category { id: string; name: string; }

export default function AdminBlogsPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [filterPublished, setFilterPublished] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);

    // Fetch danh mục để filter
    useEffect(() => {
        fetch('/api/admin/blog-categories')
            .then(r => r.json())
            .then(d => { if (d.ok) setCategories(d.categories); })
            .catch(() => { });
    }, []);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page), limit: '10',
                ...(search ? { search } : {}),
                ...(filterPublished !== '' ? { isPublished: filterPublished } : {}),
                ...(filterCategory ? { categoryId: filterCategory } : {}),
            });
            const res = await fetch(`/api/admin/blogs?${params}`);
            const data = await res.json();
            if (data.ok) { setPosts(data.posts); setPagination(data.pagination); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [page, search, filterPublished, filterCategory]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);
    useEffect(() => { setPage(1); }, [search, filterPublished, filterCategory]);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Xóa bài viết "${title}"?`)) return;
        setDeleting(id);
        try {
            const res = await fetch(`/api/admin/blogs/${id}`, { method: 'DELETE' });
            if (res.ok) fetchPosts();
            else alert('Không thể xóa');
        } catch { alert('Lỗi kết nối'); }
        finally { setDeleting(null); }
    };

    const handleTogglePublish = async (post: Post) => {
        try {
            const fullRes = await fetch(`/api/admin/blogs/${post.id}`);
            const fullData = await fullRes.json();
            if (!fullData.ok) { alert('Không thể tải dữ liệu bài viết'); return; }

            const res = await fetch(`/api/admin/blogs/${post.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: post.title,
                    slug: post.slug,
                    excerpt: post.excerpt,
                    thumbnail: post.thumbnail,
                    content: fullData.post.content,
                    isPublished: !post.isPublished,
                    categoryId: post.category?.id ?? null,
                    type: fullData.post.type,
                }),
            });
            if (res.ok) fetchPosts();
            else alert('Lỗi khi cập nhật trạng thái');
        } catch { alert('Lỗi kết nối'); }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Quản lý Blog</h1>
                    {pagination && <p className="text-sm text-gray-400 mt-0.5">{pagination.total} bài viết</p>}
                </div>
                <button onClick={() => router.push('/admin/blogs/new')}
                    className="flex items-center gap-2 bg-[#00b14f] hover:bg-[#009940] text-white text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Viết bài mới
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-5">
                <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                    <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                        placeholder="Tìm theo tiêu đề..."
                        className="flex-1 h-9 px-3 text-sm bg-gray border border-gray-200 rounded-lg outline-none focus:border-[#00b14f] transition" />
                    <button type="submit" className="h-9 px-4 bg-gray border border-gray-200 hover:bg-gray-800 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors">Tìm</button>
                    {search && (
                        <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }}
                            className="h-9 px-3 bg-gray-100 text-gray-400 hover:text-gray-700 text-sm cursor-pointer">Xóa</button>
                    )}
                </form>
                <select value={filterPublished} onChange={e => setFilterPublished(e.target.value)}
                    className="h-9 px-3 text-sm bg-gray border border-gray-200 rounded-lg outline-none focus:border-[#00b14f] cursor-pointer">
                    <option className='text-white hover:bg-red-600 bg-gray-800' value="">Tất cả</option>
                    <option className='text-white hover:bg-red-600 bg-gray-800' value="true">Đã đăng</option>
                    <option className='text-white hover:bg-red-600 bg-gray-800' value="false">Nháp</option>
                </select>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                    className="h-9 px-3 text-sm bg-gray border border-gray-200 rounded-lg outline-none focus:border-[#00b14f] cursor-pointer">
                    <option className='text-white hover:bg-red-600 bg-gray-800' value="">Tất cả danh mục</option>
                    {categories.map(cat => (
                        <option className='text-white hover:bg-red-600 bg-gray-800' key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 font-medium">Chưa có bài viết nào</div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                {['Bài viết', 'Danh mục', 'Trạng thái', 'Lượt xem', 'Ngày tạo', ''].map(h => (
                                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {posts.map(post => (
                                <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                                                {post.thumbnail
                                                    ? <img src={post.thumbnail} className="w-full h-full object-cover" alt="" />
                                                    : <div className="w-full h-full flex items-center justify-center text-lg">📝</div>
                                                }
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate max-w-[280px]">{post.title}</p>
                                                <p className="text-xs text-gray-400 truncate max-w-[280px] mt-0.5 font-mono">{post.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {post.category
                                            ? <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">{post.category.name}</span>
                                            : <span className="text-xs text-gray-300">—</span>
                                        }
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <button onClick={() => handleTogglePublish(post)}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-all hover:opacity-80 ${post.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                            {post.isPublished ? '✅ Đã đăng' : '📝 Nháp'}
                                        </button>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-gray-500">{post.views.toLocaleString()}</td>
                                    <td className="px-5 py-3.5 text-xs text-gray-400">
                                        {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => router.push(`/admin/blogs/${post.id}/edit`)}
                                                className="h-8 px-3 text-xs font-semibold text-[#00963e] bg-[#f0faf4] hover:bg-[#e0f5ea] rounded-lg cursor-pointer transition-colors">
                                                Chỉnh sửa
                                            </button>
                                            <button onClick={() => handleDelete(post.id, post.title)} disabled={deleting === post.id}
                                                className="h-8 px-3 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer transition-colors disabled:opacity-50">
                                                {deleting === post.id ? '...' : 'Xóa'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-5">
                    <p className="text-sm text-gray-400">
                        {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrev}
                            className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 disabled:opacity-40 cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                            .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                                acc.push(p); return acc;
                            }, [])
                            .map((p, i) => p === '...'
                                ? <span key={`d${i}`} className="w-8 text-center text-gray-400 text-sm">...</span>
                                : <button key={p} onClick={() => setPage(p as number)}
                                    className={`h-8 w-8 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${pagination.page === p ? 'bg-[#00b14f] text-white' : 'border border-gray-200 text-gray-600 hover:border-gray-400'
                                        }`}>
                                    {p}
                                </button>
                            )}
                        <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}
                            className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 disabled:opacity-40 cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}