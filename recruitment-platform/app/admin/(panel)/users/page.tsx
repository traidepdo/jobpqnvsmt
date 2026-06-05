'use client'
import React, { useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string;
    isLocked: boolean;
    isActive: boolean;
    createdAt: string;
}

type ToastType = 'success' | 'error';
interface Toast { message: string; type: ToastType; }
interface LockModal { open: boolean; userId: string | null; userName: string; isLocked: boolean; }
interface DeleteModal { open: boolean; userId: string | null; userName: string; }

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<Toast | null>(null);
    const [lockModal, setLockModal] = useState<LockModal>({ open: false, userId: null, userName: '', isLocked: false });
    const [deleteModal, setDeleteModal] = useState<DeleteModal>({ open: false, userId: null, userName: '' });
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => { fetchUsers(); }, [page, limit, search]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit), search: String(search) });
            const res = await fetch(`/api/admin/users?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            if (!data.users) throw new Error(data.message || 'Unknown error');
            setUsers(data.users);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const openLock = (user: User) => setLockModal({ open: true, userId: user.id, userName: user.name, isLocked: user.isLocked });
    const closeLock = () => setLockModal({ open: false, userId: null, userName: '', isLocked: false });

    const handleToggleLock = async () => {
        const { userId, isLocked, userName } = lockModal;
        if (!userId) return;
        setActionLoading(userId);
        closeLock();
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isLocked: !isLocked }),
            });
            if (!res.ok) throw new Error();
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isLocked: !isLocked } : u));
            showToast(isLocked ? `Đã mở khóa tài khoản "${userName}"` : `Đã khóa tài khoản "${userName}"`, 'success');
        } catch { showToast('Có lỗi xảy ra, vui lòng thử lại.', 'error'); }
        finally { setActionLoading(null); }
    };

    const openDelete = (user: User) => setDeleteModal({ open: true, userId: user.id, userName: user.name });
    const closeDelete = () => setDeleteModal({ open: false, userId: null, userName: '' });

    const handleDelete = async () => {
        const { userId, userName } = deleteModal;
        if (!userId) return;
        setActionLoading(userId);
        closeDelete();
        try {
            const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            setUsers(prev => prev.filter(u => u.id !== userId));
            showToast(`Đã xóa tài khoản "${userName}"`, 'success');
        } catch { showToast('Xóa tài khoản thất bại, vui lòng thử lại.', 'error'); }
        finally { setActionLoading(null); }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const handleSearch = () => { setPage(1); setSearch(searchInput); };
    const handleClearSearch = () => { setSearchInput(''); setSearch(''); setPage(1); };
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

    const startIndex = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
    const endIndex = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

    // Avatar color map by role
    const avatarColor = (role: string) =>
        role === 'ADMIN' ? 'bg-amber-500' : role === 'EMPLOYER' ? 'bg-violet-500' : 'bg-indigo-500';

    return (
        <div className="min-h-screen p-8" style={{ background: 'linear-gradient(135deg, #060810 0%, #0d1117 100%)' }}>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <h1 className="text-2xl font-bold text-white">Quản lý người dùng</h1>
                {!loading && (
                    <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold px-3 py-1 rounded-full">
                        {pagination?.total ?? users.length} tài khoản
                    </span>
                )}
            </div>

            {/* Search bar */}
            <div className="flex gap-3 mb-5">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm kiếm người dùng..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full pl-9 pr-9 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:bg-white/8 transition-colors"
                    />
                    {searchInput && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-lg leading-none"
                        >×</button>
                    )}
                </div>
                <button
                    onClick={handleSearch}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
                >
                    Tìm kiếm
                </button>
            </div>

            {/* Table Card */}
            <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {loading ? (
                    <div className="text-center py-16 text-gray-500">Đang tải dữ liệu...</div>
                ) : users.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">Không có người dùng nào.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    {['Người dùng', 'Email', 'Vai trò', 'Điện thoại', 'Trạng thái', 'Khóa TK', 'Ngày tạo', 'Thao tác'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, idx) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                        style={idx % 2 === 0 ? {} : { background: 'rgba(255,255,255,0.015)' }}
                                    >
                                        {/* Name + ID */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full ${avatarColor(user.role)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                                                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white">{user.name}</div>
                                                    <div className="text-xs text-gray-600 font-mono truncate max-w-[140px]">{user.id}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Email */}
                                        <td className="px-4 py-3 text-gray-300">{user.email}</td>

                                        {/* Role */}
                                        <td className="px-4 py-3">
                                            <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${user.role === 'ADMIN'
                                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                                : user.role === 'EMPLOYER'
                                                    ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                                                    : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>

                                        {/* Phone */}
                                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{user.phone || '—'}</td>

                                        {/* Active */}
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                                                {user.isActive ? 'Hoạt động' : 'Không HĐ'}
                                            </span>
                                        </td>

                                        {/* Lock badge */}
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${user.isLocked
                                                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                }`}>
                                                {user.isLocked ? '🔒 Đã khóa' : '🔓 Bình thường'}
                                            </span>
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(user.createdAt)}</td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openLock(user)}
                                                    disabled={actionLoading === user.id}
                                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed border ${user.isLocked
                                                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                                                        }`}
                                                >
                                                    {actionLoading === user.id ? (
                                                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                        </svg>
                                                    ) : user.isLocked ? '🔓 Mở khóa' : '🔒 Khóa'}
                                                </button>

                                                <button
                                                    onClick={() => openDelete(user)}
                                                    disabled={actionLoading === user.id}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    🗑 Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-5 text-sm text-gray-500">
                    <span>Hiển thị {startIndex}–{endIndex} / {pagination.total} người dùng</span>
                    <div className="flex gap-1">
                        {[
                            { label: '«', onClick: () => setPage(1), disabled: page === 1 },
                            { label: '‹', onClick: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1 },
                        ].map(btn => (
                            <button key={btn.label} onClick={btn.onClick} disabled={btn.disabled}
                                className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg disabled:opacity-30 hover:bg-white/10 transition-colors text-gray-300">
                                {btn.label}
                            </button>
                        ))}

                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                            .reduce<(number | '...')[]>((acc, p, i, arr) => {
                                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                p === '...' ? (
                                    <span key={`dots-${i}`} className="px-2 py-1 text-gray-600">…</span>
                                ) : (
                                    <button key={p} onClick={() => setPage(p as number)}
                                        className={`px-3 py-1 border rounded-lg transition-colors ${p === page
                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                            }`}>
                                        {p}
                                    </button>
                                )
                            )}

                        {[
                            { label: '›', onClick: () => setPage(p => Math.min(pagination.totalPages, p + 1)), disabled: page === pagination.totalPages },
                            { label: '»', onClick: () => setPage(pagination.totalPages), disabled: page === pagination.totalPages },
                        ].map(btn => (
                            <button key={btn.label} onClick={btn.onClick} disabled={btn.disabled}
                                className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg disabled:opacity-30 hover:bg-white/10 transition-colors text-gray-300">
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Lock Modal */}
            {lockModal.open && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={closeLock}>
                    <div className="rounded-2xl p-8 w-[360px] max-w-[92vw] shadow-2xl border border-white/10"
                        style={{ background: '#0f1420' }}
                        onClick={e => e.stopPropagation()}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 ${lockModal.isLocked ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                            {lockModal.isLocked ? '🔓' : '🔒'}
                        </div>
                        <h2 className="text-lg font-bold text-white text-center mb-2">
                            {lockModal.isLocked ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
                        </h2>
                        <p className="text-sm text-gray-400 text-center leading-relaxed mb-6">
                            {lockModal.isLocked
                                ? <>Mở khóa tài khoản của <span className="font-semibold text-white">{lockModal.userName}</span>? Người dùng sẽ có thể đăng nhập trở lại.</>
                                : <>Khóa tài khoản của <span className="font-semibold text-white">{lockModal.userName}</span>? Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.</>
                            }
                        </p>
                        <div className="flex gap-3">
                            <button onClick={closeLock} className="flex-1 py-2.5 rounded-xl bg-white/8 border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/12 transition-colors">
                                Hủy
                            </button>
                            <button onClick={handleToggleLock}
                                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors ${lockModal.isLocked ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'}`}>
                                {lockModal.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={closeDelete}>
                    <div className="rounded-2xl p-8 w-[360px] max-w-[92vw] shadow-2xl border border-white/10"
                        style={{ background: '#0f1420' }}
                        onClick={e => e.stopPropagation()}>
                        <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-2xl mx-auto mb-4">🗑️</div>
                        <h2 className="text-lg font-bold text-white text-center mb-2">Xóa tài khoản?</h2>
                        <p className="text-sm text-gray-400 text-center leading-relaxed mb-6">
                            Bạn có chắc muốn xóa tài khoản của{' '}
                            <span className="font-semibold text-white">{deleteModal.userName}</span>?{' '}
                            Hành động này <span className="font-semibold text-red-400">không thể hoàn tác</span>.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={closeDelete} className="flex-1 py-2.5 rounded-xl bg-white/8 border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/12 transition-colors">
                                Hủy
                            </button>
                            <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors">
                                Xóa tài khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl text-white border ${toast.type === 'success'
                    ? 'bg-emerald-600/90 border-emerald-500/50'
                    : 'bg-red-600/90 border-red-500/50'
                    }`}>
                    {toast.type === 'success' ? '✓' : '✕'} {toast.message}
                </div>
            )}
        </div>
    );
}