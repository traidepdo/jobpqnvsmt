// app/admin/blog-categories/page.tsx
'use client'
import React, { useState, useEffect, useCallback } from 'react';

interface Category {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    _count: { blogs: number };
}

export default function AdminBlogCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form thêm/sửa
    const [editId, setEditId] = useState<string | null>(null);
    const [formName, setFormName] = useState('');
    const [formSlug, setFormSlug] = useState('');
    const [showForm, setShowForm] = useState(false);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/blog-categories?withCount=true');
            const data = await res.json();
            if (data.ok) setCategories(data.categories);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const handleNameChange = (v: string) => {
        setFormName(v);
        if (!editId) {
            setFormSlug(
                v.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[đĐ]/g, 'd')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-').replace(/-+/g, '-').trim()
            );
        }
    };

    const openCreate = () => {
        setEditId(null);
        setFormName('');
        setFormSlug('');
        setShowForm(true);
    };

    const openEdit = (cat: Category) => {
        setEditId(cat.id);
        setFormName(cat.name);
        setFormSlug(cat.slug);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditId(null);
        setFormName('');
        setFormSlug('');
    };

    const handleSave = async () => {
        if (!formName.trim()) { alert('Vui lòng nhập tên danh mục'); return; }
        if (!formSlug.trim()) { alert('Vui lòng nhập slug'); return; }
        setSaving(true);
        try {
            const url = editId ? `/api/admin/blog-categories/${editId}` : '/api/admin/blog-categories';
            const method = editId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formName.trim(), slug: formSlug.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                closeForm();
                fetchCategories();
            } else {
                alert(data.error || 'Có lỗi xảy ra');
            }
        } catch { alert('Lỗi kết nối'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (cat: Category) => {
        if (cat._count.blogs > 0) {
            alert(`Không thể xóa danh mục "${cat.name}" vì đang có ${cat._count.blogs} bài viết.`);
            return;
        }
        if (!confirm(`Xóa danh mục "${cat.name}"?`)) return;
        setDeleting(cat.id);
        try {
            const res = await fetch(`/api/admin/blog-categories/${cat.id}`, { method: 'DELETE' });
            if (res.ok) fetchCategories();
            else alert('Không thể xóa');
        } catch { alert('Lỗi kết nối'); }
        finally { setDeleting(null); }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Danh mục Blog</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{categories.length} danh mục</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 bg-[#00b14f] hover:bg-[#009940] text-white text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm danh mục
                </button>
            </div>

            {/* Form thêm/sửa — inline card */}
            {showForm && (
                <div className="bg-white border border-[#00b14f]/30 rounded-2xl p-5 mb-5 shadow-sm">
                    <p className="text-sm font-bold text-gray-700 mb-4">
                        {editId ? '✏️ Chỉnh sửa danh mục' : '➕ Thêm danh mục mới'}
                    </p>
                    <div className="flex flex-col gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tên danh mục *</label>
                            <input
                                value={formName}
                                onChange={e => handleNameChange(e.target.value)}
                                placeholder="VD: Kinh nghiệm làm việc"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                                className="w-full h-9 px-3 text-sm text-black bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#00b14f] transition"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Slug *</label>
                            <input
                                value={formSlug}
                                onChange={e => setFormSlug(e.target.value)}
                                placeholder="kinh-nghiem-lam-viec"
                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                                className="w-full h-9 px-3 text-sm text-black font-mono bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#00b14f] transition"
                            />
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={handleSave} disabled={saving}
                                className="h-9 px-5 bg-[#00b14f] hover:bg-[#009940] text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors disabled:opacity-60 flex items-center gap-2">
                                {saving && <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
                                {saving ? 'Đang lưu...' : editId ? 'Cập nhật' : 'Thêm'}
                            </button>
                            <button onClick={closeForm}
                                className="h-9 px-4 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-400 font-medium">Chưa có danh mục nào</p>
                        <p className="text-sm text-gray-300 mt-1">Bấm "Thêm danh mục" để tạo mới</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                                {['Tên danh mục', 'Slug', 'Bài viết', ''].map(h => (
                                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {categories.map(cat => (
                                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <span className="text-sm font-semibold text-gray-800">{cat.name}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-xs font-mono text-gray-400">{cat.slug}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat._count.blogs > 0
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            {cat._count.blogs} bài
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button onClick={() => openEdit(cat)}
                                                className="h-8 px-3 text-xs font-semibold text-[#00963e] bg-[#f0faf4] hover:bg-[#e0f5ea] rounded-lg cursor-pointer transition-colors">
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat)}
                                                disabled={deleting === cat.id}
                                                className="h-8 px-3 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer transition-colors disabled:opacity-50">
                                                {deleting === cat.id ? '...' : 'Xóa'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}