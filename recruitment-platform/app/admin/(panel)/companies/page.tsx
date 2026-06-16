'use client'
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
interface Company {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    website: string | null;
    industry: string | null;
    size: string | null;
    description: string | null;
    addressDetail: string | null;
    isApproved: boolean;
    isActive: boolean;
    createdAt: string;
    owner: { id: string; name: string; email: string; phone?: string | null };
    _count: { jobs: number };
}

type ToastType = 'success' | 'error';
interface Toast { message: string; type: ToastType; }
type ModalType = 'approve' | 'reject' | 'lock' | 'unlock' | 'delete';
interface ConfirmModal { open: boolean; type: ModalType | null; companyId: string | null; companyName: string; }

const MODAL_CONFIG: Record<ModalType, { icon: string; bg: string; title: string; btnClass: string; btnLabel: string }> = {
    approve: { icon: '✅', bg: 'bg-emerald-100', title: 'Duyệt công ty?', btnClass: 'bg-emerald-600 hover:bg-emerald-700', btnLabel: 'Duyệt' },
    reject: { icon: '❌', bg: 'bg-red-100', title: 'Từ chối công ty?', btnClass: 'bg-red-600 hover:bg-red-700', btnLabel: 'Từ chối' },
    lock: { icon: '🔒', bg: 'bg-amber-100', title: 'Khóa công ty?', btnClass: 'bg-amber-600 hover:bg-amber-700', btnLabel: 'Khóa' },
    unlock: { icon: '🔓', bg: 'bg-blue-100', title: 'Mở khóa công ty?', btnClass: 'bg-blue-600 hover:bg-blue-700', btnLabel: 'Mở khóa' },
    delete: { icon: '🗑️', bg: 'bg-red-100', title: 'Xóa công ty?', btnClass: 'bg-red-600 hover:bg-red-700', btnLabel: 'Xóa công ty' },
};

const MODAL_DESC: Record<ModalType, (name: string) => React.ReactNode> = {
    approve: (n) => <>Duyệt công ty <b className="text-gray-800">{n}</b>? Công ty sẽ hiển thị công khai.</>,
    reject: (n) => <>Từ chối công ty <b className="text-gray-800">{n}</b>?</>,
    lock: (n) => <>Khóa công ty <b className="text-gray-800">{n}</b>? Công ty sẽ bị ẩn cho đến khi mở khóa.</>,
    unlock: (n) => <>Mở khóa công ty <b className="text-gray-800">{n}</b>? Công ty sẽ hoạt động trở lại.</>,
    delete: (n) => <>Xóa công ty <b className="text-gray-800">{n}</b>? Hành động này <span className="text-red-600 font-semibold">không thể hoàn tác</span>.</>,
};

const SIZE_LABEL: Record<string, string> = { SMALL: '1–50', MEDIUM: '51–200', LARGE: '201–500', ENTERPRISE: '500+' };

// ── Detail Modal ──────────────────────────────────────────────────────────────
function CompanyDetailModal({ company, onClose, onAction }: {
    company: Company;
    onClose: () => void;
    onAction: (type: ModalType, company: Company) => void;
}) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white/30">
                        {company.logo
                            ? <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                            : <span className="text-xl font-bold text-white">{company.name.charAt(0)}</span>
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-white truncate">{company.name}</h2>
                        <p className="text-indigo-200 text-sm">{company.industry || 'Chưa cập nhật ngành'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Status + stats */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {!company.isActive ? (
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-600">🔒 Đã khóa</span>
                        ) : company.isApproved ? (
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">✅ Đã duyệt</span>
                        ) : (
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">⏳ Chờ duyệt</span>
                        )}
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
                            {company._count.jobs} tin tuyển dụng
                        </span>
                        {company.size && (
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                                👥 {SIZE_LABEL[company.size] ?? company.size} nhân viên
                            </span>
                        )}
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Chủ sở hữu', value: company.owner.name },
                            { label: 'Email', value: company.owner.email },
                            { label: 'Số điện thoại', value: company.owner.phone || '—' },
                            { label: 'Ngày tạo', value: new Date(company.createdAt).toLocaleDateString('vi-VN') },
                            { label: 'Website', value: company.website || '—' },
                            { label: 'Địa chỉ', value: company.addressDetail || '—' },
                        ].map(row => (
                            <div key={row.label} className="bg-gray-50 rounded-xl px-4 py-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{row.label}</p>
                                <p className="text-sm font-medium text-gray-700 truncate">{row.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    {company.description && (
                        <div className="bg-gray-50 rounded-xl px-4 py-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Mô tả</p>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{company.description}</p>
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-2 flex-wrap bg-gray-50/50">
                    {company.isActive && !company.isApproved && (
                        <>
                            <button onClick={() => { onClose(); onAction('approve', company); }}
                                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer">
                                ✅ Duyệt
                            </button>
                            <button onClick={() => { onClose(); onAction('reject', company); }}
                                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-600 transition-colors cursor-pointer">
                                ❌ Từ chối
                            </button>
                        </>
                    )}
                    {company.isActive ? (
                        <button onClick={() => { onClose(); onAction('lock', company); }}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors cursor-pointer">
                            🔒 Khóa
                        </button>
                    ) : (
                        <button onClick={() => { onClose(); onAction('unlock', company); }}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors cursor-pointer">
                            🔓 Mở khóa
                        </button>
                    )}
                    <button onClick={() => { onClose(); onAction('delete', company); }}
                        className="py-2 px-4 rounded-xl text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-600 transition-colors cursor-pointer">
                        🗑 Xóa
                    </button>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<Toast | null>(null);
    const [modal, setModal] = useState<ConfirmModal>({ open: false, type: null, companyId: null, companyName: '' });
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'LOCKED'>('ALL');
    const [detailCompany, setDetailCompany] = useState<Company | null>(null);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const searchParams = useSearchParams();
    useEffect(() => { fetchCompanies(); }, []);
    const fetchCompanies = () => {
        setLoading(true);
        fetch('/api/admin/companies')
            .then(r => r.json())
            .then(d => setCompanies(d.companies || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };
    useEffect(() => {
        const id = searchParams.get('id');
        if (id && companies.length > 0) {
            const found = companies.find(c => c.id === id);
            if (found) setDetailCompany(found);
        }
    }, [companies, searchParams]);
    useEffect(() => {
        const q = searchParams.get('search');
        if (q) {
            setSearchInput(q);
            setSearch(q);
        }
    }, [searchParams]);

    const filtered = companies.filter(c => {
        const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
        if (filter === 'PENDING') return matchSearch && !c.isApproved && c.isActive;
        if (filter === 'APPROVED') return matchSearch && c.isApproved && c.isActive;
        if (filter === 'LOCKED') return matchSearch && !c.isActive;
        return matchSearch;
    });
    const openModal = (type: ModalType, company: Company) =>
        setModal({ open: true, type, companyId: company.id, companyName: company.name });
    const closeModal = () =>
        setModal({ open: false, type: null, companyId: null, companyName: '' });

    const handleConfirm = async () => {
        const { type, companyId, companyName } = modal;
        if (!type || !companyId) return;
        setActionLoading(companyId);
        closeModal();
        try {
            if (type === 'delete') {
                const res = await fetch(`/api/admin/companies/${companyId}`, { method: 'DELETE' });
                if (!res.ok) throw new Error();
                setCompanies(prev => prev.filter(c => c.id !== companyId));
                showToast(`Đã xóa công ty "${companyName}"`, 'success');
            } else {
                const data =
                    type === 'approve' ? { isApproved: true, isActive: true } :
                        type === 'reject' ? { isApproved: false, isActive: false } :
                            type === 'lock' ? { isActive: false } : { isActive: true };
                const res = await fetch(`/api/admin/companies/${companyId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!res.ok) throw new Error();
                setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, ...data } : c));
                const msgs: Record<ModalType, string> = {
                    approve: `Đã duyệt "${companyName}"`,
                    reject: `Đã từ chối "${companyName}"`,
                    lock: `Đã khóa "${companyName}"`,
                    unlock: `Đã mở khóa "${companyName}"`,
                    delete: '',
                };
                showToast(msgs[type], 'success');
            }
        } catch {
            showToast('Có lỗi xảy ra, vui lòng thử lại.', 'error');
        } finally {
            setActionLoading(null);
        }
    };
    const counts = {
        ALL: companies.length,
        PENDING: companies.filter(c => !c.isApproved && c.isActive).length,
        APPROVED: companies.filter(c => c.isApproved && c.isActive).length,
        LOCKED: companies.filter(c => !c.isActive).length,
    };

    const cfg = modal.type ? MODAL_CONFIG[modal.type] : null;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Quản lý công ty</h1>
                {!loading && (
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                        {companies.length} công ty
                    </span>
                )}

                <div className='flex gap-3'>
                    <label htmlFor="search" className="sr-only text-black">Tìm kiếm công ty</label>
                    <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                        className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-black"
                        placeholder="Tìm kiếm theo tên công ty"
                        onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)} />

                    <button onClick={() => setSearch(searchInput)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
                        Tìm kiếm
                    </button>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-5">
                {(['ALL', 'PENDING', 'APPROVED', 'LOCKED'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
                        {{ ALL: 'Tất cả', PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', LOCKED: 'Đã khóa' }[f]}
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${filter === f ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {counts[f]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-[3px] border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">Không có công ty nào.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b-2 border-gray-100">
                                    {['Công ty', 'Chủ sở hữu', 'Ngành', 'Quy mô', 'Trạng thái', 'Ngày tạo', 'Thao tác'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(company => (
                                    <tr key={company.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    {company.logo
                                                        ? <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                                                        : <span className="text-base font-bold text-gray-400">{company.name.charAt(0)}</span>
                                                    }
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-800">{company.name}</div>
                                                    {company.website && (
                                                        <a href={company.website} target="_blank" rel="noopener noreferrer"
                                                            className="text-xs text-indigo-500 hover:underline truncate max-w-[150px] block">
                                                            {company.website.replace(/^https?:\/\//, '')}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-700">{company.owner.name}</div>
                                            <div className="text-xs text-gray-400">{company.owner.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 text-xs">{company.industry || '—'}</td>
                                        <td className="px-4 py-3">
                                            {company.size
                                                ? <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{SIZE_LABEL[company.size] ?? company.size}</span>
                                                : '—'}
                                        </td>
                                        <td className="px-0 py-3">
                                            {!company.isActive ? (
                                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-600">🔒 Đã khóa</span>
                                            ) : company.isApproved ? (
                                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">✅ Đã duyệt</span>
                                            ) : (
                                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">⏳ Chờ duyệt</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            {new Date(company.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {/* Nút xem chi tiết */}
                                                <button
                                                    onClick={() => setDetailCompany(company)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer">
                                                    👁 Xem
                                                </button>

                                                {company.isActive && !company.isApproved && (
                                                    <>
                                                        <button onClick={() => openModal('approve', company)} disabled={actionLoading === company.id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50 cursor-pointer">
                                                            ✅ Duyệt
                                                        </button>
                                                        <button onClick={() => openModal('reject', company)} disabled={actionLoading === company.id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50 cursor-pointer">
                                                            ❌ Từ chối
                                                        </button>
                                                    </>
                                                )}
                                                {company.isActive ? (
                                                    <button onClick={() => openModal('lock', company)} disabled={actionLoading === company.id}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors disabled:opacity-50 cursor-pointer">
                                                        🔒 Khóa
                                                    </button>
                                                ) : (
                                                    <button onClick={() => openModal('unlock', company)} disabled={actionLoading === company.id}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50 cursor-pointer">
                                                        🔓 Mở khóa
                                                    </button>
                                                )}
                                                <button onClick={() => openModal('delete', company)} disabled={actionLoading === company.id}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50 cursor-pointer">
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

            {/* Detail Modal */}
            {detailCompany && (
                <CompanyDetailModal
                    company={detailCompany}
                    onClose={() => setDetailCompany(null)}
                    onAction={(type, company) => openModal(type, company)}
                />
            )}

            {/* Confirm Modal */}
            {modal.open && cfg && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={closeModal}>
                    <div className="bg-white rounded-2xl p-8 w-[380px] max-w-[92vw] shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 ${cfg.bg}`}>
                            {cfg.icon}
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 text-center mb-2">{cfg.title}</h2>
                        <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">
                            {MODAL_DESC[modal.type!](modal.companyName)}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors cursor-pointer">
                                Hủy
                            </button>
                            <button onClick={handleConfirm} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors cursor-pointer ${cfg.btnClass}`}>
                                {cfg.btnLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-lg text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                    {toast.type === 'success' ? '✓' : '✕'} {toast.message}
                </div>
            )}
        </div>
    );
}