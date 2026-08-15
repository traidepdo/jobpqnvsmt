'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Interview } from '@/lib/types/candidate/interviews';
import { STATUS_CFG, CANDIDATE_CFG, RESULT_CFG } from '@/lib/interviewLabels';
import { useInterviews } from '@/lib/hooks/useInterviews';

// ── Modal từ chối ─────────────────────────────────────────────
function DeclineModal({ onConfirm, onClose }: { onConfirm: (reason: string) => void; onClose: () => void }) {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 animate-slideUp">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">Từ chối lịch phỏng vấn</h3>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
                <div className="px-5 py-4">
                    <p className="text-xs text-slate-400 mb-2.5">Vui lòng cho biết lý do từ chối để nhà tuyển dụng sắp xếp lại:</p>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Ví dụ: Tôi có lịch bận đột xuất, mong muốn được dời sang ngày khác..."
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-rose-400 focus:ring-0 resize-none text-slate-700 placeholder-slate-400 bg-slate-50/50"
                    />
                </div>
                <div className="px-5 py-3.5 border-t border-slate-50 flex gap-2.5 justify-end">
                    <button onClick={onClose} className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
                        Hủy
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        className="flex items-center gap-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-sm">thumb_down</span>
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Modal chi tiết lịch phỏng vấn ──────────────────────────────
function DetailsModal({ interview, onClose, formatDateTime }: { interview: Interview; onClose: () => void; formatDateTime: (d: string) => string }) {
    const sCfg = STATUS_CFG[interview.status];
    const cCfg = CANDIDATE_CFG[interview.candidateStatus];
    const rCfg = RESULT_CFG[interview.result || 'PENDING'];
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-slideUp">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                            <span className="material-symbols-outlined text-[18px]">info</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">Chi tiết lịch phỏng vấn</h3>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
                
                {/* Modal Body */}
                <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <h4 className="text-base font-bold text-slate-800">{interview.application.job.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{interview.application.job.company.name}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 border-t border-b border-slate-100 py-3.5 text-xs">
                        <div>
                            <span className="text-slate-400 block mb-1">Trạng thái lịch</span>
                            <span className="inline-block px-2.5 py-0.5 rounded-lg border font-bold text-[10px]"
                                style={{ color: sCfg.color, background: sCfg.bg, borderColor: sCfg.border }}>
                                {sCfg.label}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block mb-1">Phản hồi của bạn</span>
                            <span className="inline-block px-2.5 py-0.5 rounded-lg font-bold text-[10px]"
                                style={{ color: cCfg.color, background: cCfg.bg }}>
                                {cCfg.label}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block mb-1">Kết quả phỏng vấn</span>
                            <span className="inline-block px-2.5 py-0.5 rounded-lg border font-bold text-[10px]"
                                style={{ color: rCfg.color, background: rCfg.bg, borderColor: rCfg.border }}>
                                {rCfg.label}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3 text-xs text-slate-600">
                        <div className="flex gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-base">schedule</span>
                            <div>
                                <span className="font-bold text-slate-700 block">Thời gian phỏng vấn</span>
                                <span>{formatDateTime(interview.scheduledAt)}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-base">
                                {interview.type === 'ONLINE' ? 'videocam' : 'location_on'}
                            </span>
                            <div>
                                <span className="font-bold text-slate-700 block">Hình thức & địa điểm</span>
                                <span>{interview.type === 'ONLINE' ? 'Phỏng vấn Online' : 'Phỏng vấn trực tiếp'}</span>
                                <p className="text-slate-500 mt-0.5">{interview.location}</p>
                                {interview.type === 'ONLINE' && (
                                    <a href={interview.location} target="_blank" rel="noreferrer"
                                        className="mt-1.5 inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 hover:underline">
                                        Vào phòng phỏng vấn
                                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {interview.notes && (
                            <div className="flex gap-2 border-t border-slate-100 pt-3">
                                <span className="material-symbols-outlined text-slate-400 text-base">description</span>
                                <div>
                                    <span className="font-bold text-slate-700 block">Ghi chú từ nhà tuyển dụng</span>
                                    <p className="text-slate-500 whitespace-pre-line mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100/50">{interview.notes}</p>
                                </div>
                            </div>
                        )}

                        {interview.declineReason && (
                            <div className="flex gap-2 border-t border-slate-100 pt-3">
                                <span className="material-symbols-outlined text-rose-400 text-base">cancel</span>
                                <div>
                                    <span className="font-bold text-rose-700 block">Lý do từ chối</span>
                                    <p className="text-rose-600 whitespace-pre-line mt-1 bg-rose-50/50 p-3 rounded-lg border border-rose-100/50">{interview.declineReason}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-5 py-3.5 border-t border-slate-50 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────
export default function CandidateInterviewsPage({ interviewsData }: { interviewsData: Interview[] }) {
    const { formatDateTime, formatCountdown, interviews, loading, respondingId, declineModal, setDeclineModal, setRespondingId, setInterviews, setLoading, respond } = useInterviews(interviewsData);
    const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
    const [filterTab, setFilterTab] = useState<string>('ALL');

    // Search, Filter & Sort states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [sortBy, setSortBy] = useState<'DATE_ASC' | 'DATE_DESC' | 'TITLE_ASC'>('DATE_ASC');

    useEffect(() => {
        if (interviewsData) {
            setInterviews(interviewsData);
            setLoading(false);
        }
    }, [interviewsData]);

    // Unique list of industries/categories for select dropdown
    const industryList = Array.from(
        new Set(
            interviews
                .map(i => i.application.job.category?.name || i.application.job.company.industry)
                .filter(Boolean) as string[]
        )
    );

    const activeList = interviews.filter(iv => {
        // 1. Filter by Tab (Status)
        if (filterTab !== 'ALL') {
            if (filterTab === 'PENDING' || filterTab === 'CONFIRMED' || filterTab === 'DECLINED') {
                if (iv.candidateStatus !== filterTab) return false;
            } else if (filterTab === 'PASSED' || filterTab === 'FAILED') {
                if (iv.result !== filterTab) return false;
            } else if (filterTab === 'SCHEDULED' || filterTab === 'COMPLETED' || filterTab === 'CANCELLED') {
                if (iv.status !== filterTab) return false;
            }
        }

        // 2. Search by Name (job title or company name)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const matchTitle = iv.application.job.title.toLowerCase().includes(q);
            const matchCompany = iv.application.job.company.name.toLowerCase().includes(q);
            if (!matchTitle && !matchCompany) return false;
        }

        // 3. Filter by Industry / Category
        if (selectedIndustry) {
            const cat = iv.application.job.category?.name;
            const ind = iv.application.job.company.industry;
            if (cat !== selectedIndustry && ind !== selectedIndustry) return false;
        }

        // 4. Filter by Date (YYYY-MM-DD)
        if (filterDate) {
            const ivDate = new Date(iv.scheduledAt).toISOString().split('T')[0];
            if (ivDate !== filterDate) return false;
        }

        return true;
    }).sort((a, b) => {
        if (sortBy === 'DATE_ASC') {
            return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        }
        if (sortBy === 'DATE_DESC') {
            return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
        }
        if (sortBy === 'TITLE_ASC') {
            return a.application.job.title.localeCompare(b.application.job.title);
        }
        return 0;
    });

    const upcoming = activeList.filter(i => (i.status === 'SCHEDULED' || i.candidateStatus === 'PENDING') && i.candidateStatus !== 'DECLINED');
    const others = activeList.filter(i => !((i.status === 'SCHEDULED' || i.candidateStatus === 'PENDING') && i.candidateStatus !== 'DECLINED'));
    const pendingCount = interviews.filter(i => i.candidateStatus === 'PENDING').length;

    const hasActiveFilters = searchQuery || selectedIndustry || filterDate || sortBy !== 'DATE_ASC';

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedIndustry('');
        setFilterDate('');
        setSortBy('DATE_ASC');
    };

    return (
        <div className="w-full space-y-6 animate-fadeIn pb-10">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6 sm:p-8 border border-emerald-500/10">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-[#00b14f] font-bold">event</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#009940]">Lịch trình</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                            Lịch phỏng vấn
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {pendingCount > 0
                                ? <span>Bạn có <span className="text-orange-500 font-bold">{pendingCount} lịch phỏng vấn</span> chờ xác nhận</span>
                                : 'Theo dõi và phản hồi các cuộc hẹn phỏng vấn từ nhà tuyển dụng'
                            }
                        </p>
                    </div>
                    {pendingCount > 0 && (
                        <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl border border-orange-200/50 shadow-sm flex items-center gap-2 self-start sm:self-auto animate-pulse">
                            <span className="material-symbols-outlined text-base font-bold">notifications_active</span>
                            <span className="text-xs font-bold">Yêu cầu phản hồi gấp</span>
                        </div>
                    )}
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-12 translate-x-12" />
            </div>

            {/* ── Unified Filter & Search Control Panel ── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden transition-all space-y-0">
                {/* Top Section: Search + Filters + Sort */}
                <div className="p-3.5 sm:p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
                        {/* Search Input (5 cols) */}
                        <div className="lg:col-span-5 relative">
                            <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Tìm theo vị trí, tên công ty..."
                                className="w-full h-10 pl-10 pr-9 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50/70 focus:bg-white text-slate-700 outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/15 transition-all placeholder:text-slate-400 placeholder:font-normal"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            )}
                        </div>

                        {/* Industry Dropdown (3 cols) */}
                        <div className="lg:col-span-3 relative">
                            <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">work</span>
                            <select
                                value={selectedIndustry}
                                onChange={e => setSelectedIndustry(e.target.value)}
                                className="w-full h-10 pl-9 pr-8 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50/70 focus:bg-white text-slate-700 outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/15 transition-all appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 10px center',
                                    backgroundSize: '14px'
                                }}
                            >
                                <option value="">Tất cả ngành nghề</option>
                                {industryList.map(ind => (
                                    <option key={ind} value={ind}>{ind}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Picker (2 cols) */}
                        <div className="lg:col-span-2 relative">
                            <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">calendar_today</span>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                                className="w-full h-10 pl-9 pr-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50/70 focus:bg-white text-slate-700 outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/15 transition-all cursor-pointer"
                            />
                        </div>

                        {/* Sort Select (2 cols) */}
                        <div className="lg:col-span-2 relative">
                            <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">sort</span>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as any)}
                                className="w-full h-10 pl-9 pr-8 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50/70 focus:bg-white text-slate-700 outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/15 transition-all appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 10px center',
                                    backgroundSize: '14px'
                                }}
                            >
                                <option value="DATE_ASC">Mới nhất (Gần nhất)</option>
                                <option value="DATE_DESC">Xa nhất</option>
                                <option value="TITLE_ASC">Tên (A - Z)</option>
                            </select>
                        </div>
                    </div>

                    {/* Active Filter Chips / Reset */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-slate-400 font-bold text-[11px]">Đang lọc ({activeList.length}):</span>
                                {searchQuery && (
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#00b14f] border border-emerald-200/60 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
                                        Từ khóa: "{searchQuery}"
                                        <button onClick={() => setSearchQuery('')} className="hover:text-emerald-700 cursor-pointer flex items-center">
                                            <span className="material-symbols-outlined text-[13px]">close</span>
                                        </button>
                                    </span>
                                )}
                                {selectedIndustry && (
                                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-200/60 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
                                        Ngành: "{selectedIndustry}"
                                        <button onClick={() => setSelectedIndustry('')} className="hover:text-blue-700 cursor-pointer flex items-center">
                                            <span className="material-symbols-outlined text-[13px]">close</span>
                                        </button>
                                    </span>
                                )}
                                {filterDate && (
                                    <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-600 border border-purple-200/60 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
                                        Ngày: {filterDate}
                                        <button onClick={() => setFilterDate('')} className="hover:text-purple-700 cursor-pointer flex items-center">
                                            <span className="material-symbols-outlined text-[13px]">close</span>
                                        </button>
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={clearFilters}
                                className="text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer ml-auto"
                            >
                                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                                Đặt lại mặc định
                            </button>
                        </div>
                    )}
                </div>

                {/* Bottom Section: Status Navigation Tabs */}
                <div className="p-2 sm:p-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                        { key: 'ALL', label: 'Tất cả', icon: 'list_alt', count: interviews.length },
                        { key: 'PENDING', label: 'Chờ xác nhận', icon: 'hourglass_empty', count: interviews.filter(i => i.candidateStatus === 'PENDING' && i.status === 'SCHEDULED').length },
                        { key: 'CONFIRMED', label: 'Đã xác nhận', icon: 'thumb_up', count: interviews.filter(i => i.candidateStatus === 'CONFIRMED').length },
                        { key: 'PASSED', label: 'Đậu phỏng vấn', icon: 'verified', count: interviews.filter(i => i.result === 'PASSED').length },
                        { key: 'FAILED', label: 'Rớt phỏng vấn', icon: 'cancel', count: interviews.filter(i => i.result === 'FAILED').length },
                        { key: 'DECLINED', label: 'Đã từ chối', icon: 'thumb_down', count: interviews.filter(i => i.candidateStatus === 'DECLINED').length },
                    ].map(tab => {
                        const isActive = filterTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setFilterTab(tab.key)}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    isActive
                                        ? 'bg-[#00b14f] text-white shadow-md shadow-[#00b14f]/25 scale-[1.02]'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-white hover:shadow-sm'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                                <span>{tab.label}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
                </div>
            ) : activeList.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">event_busy</span>
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">Không tìm thấy lịch phỏng vấn</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mb-5">
                        Không có lịch phỏng vấn nào phù hợp với bộ lọc được chọn.
                    </p>
                    <button 
                        onClick={() => setFilterTab('ALL')}
                        className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-all cursor-pointer"
                    >
                        Xem tất cả lịch hẹn
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* ── Upcoming ── */}
                    {upcoming.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">
                                Sắp diễn ra ({upcoming.length})
                            </h2>
                            <div className="space-y-3">
                                {upcoming.map(iv => {
                                    const cCfg = CANDIDATE_CFG[iv.candidateStatus];
                                    const countdown = formatCountdown(iv.scheduledAt);
                                    const isPending = iv.candidateStatus === 'PENDING';

                                    return (
                                        <div 
                                            key={iv.id} 
                                            className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)]
                                                ${isPending ? 'border-orange-200/80 bg-orange-50/5' : 'border-slate-100'}`}
                                        >
                                            {/* Pending banner */}
                                            {isPending && (
                                                <div className="px-4 py-2 bg-orange-50 border-b border-orange-100/50 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-sm text-orange-500 animate-pulse">notifications_active</span>
                                                    <p className="text-[10px] font-bold text-orange-700">Cần xác nhận — nhà tuyển dụng đang chờ phản hồi của bạn</p>
                                                </div>
                                            )}

                                            <div className="p-4.5">
                                                <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
                                                    <div className="flex gap-3.5 min-w-0">
                                                        {/* Company logo */}
                                                        <div className="w-12 h-12 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center p-1.5 flex-shrink-0 shadow-sm">
                                                            {iv.application.job.company.logo
                                                                ? <img src={iv.application.job.company.logo} alt="" className="w-full h-full object-contain rounded" />
                                                                : <span className="text-blue-600 font-bold text-base">{iv.application.job.company.name[0]}</span>
                                                            }
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-800 text-sm sm:text-base line-clamp-1">{iv.application.job.title}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <p className="text-xs text-slate-500">{iv.application.job.company.name}</p>
                                                                <span className="text-slate-300 text-xs">•</span>
                                                                <button
                                                                    onClick={() => setSelectedInterview(iv)}
                                                                    className="text-xs text-[#00b14f] hover:text-[#009940] hover:underline font-semibold cursor-pointer"
                                                                >
                                                                    Chi tiết lịch hẹn
                                                                </button>
                                                            </div>

                                                            {/* Thời gian */}
                                                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                                                <span className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg">
                                                                    <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
                                                                    <span className="font-semibold">{formatDateTime(iv.scheduledAt)}</span>
                                                                </span>
                                                                {countdown && (
                                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100/30">
                                                                        <span className="material-symbols-outlined text-[13px]">timer</span>
                                                                        Còn {countdown}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Hình thức & địa điểm */}
                                                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                                                                <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-md">
                                                                    <span className="material-symbols-outlined text-[13px]">
                                                                        {iv.type === 'ONLINE' ? 'videocam' : 'location_on'}
                                                                    </span>
                                                                    {iv.type === 'ONLINE' ? 'Online' : 'Trực tiếp'}
                                                                </span>
                                                                <span className="text-[11px] text-slate-400 truncate max-w-[260px] self-center">
                                                                    {iv.location}
                                                                </span>
                                                                {iv.type === 'ONLINE' && (
                                                                    <a href={iv.location} target="_blank" rel="noreferrer"
                                                                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 hover:underline">
                                                                        Tham gia
                                                                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                                                    </a>
                                                                )}
                                                            </div>

                                                            {/* Ghi chú */}
                                                            {iv.notes && (
                                                                <div className="mt-3.5 px-3.5 py-2.5 bg-slate-50 border border-slate-100/40 rounded-lg text-xs text-slate-500">
                                                                    <span className="font-bold text-slate-600">Ghi chú:</span> {iv.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Status badge */}
                                                    <span 
                                                        className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 self-start sm:self-auto"
                                                        style={{ color: cCfg.color, background: cCfg.bg, borderColor: 'transparent' }}
                                                    >
                                                        <span className="material-symbols-outlined text-[13px]">{cCfg.icon}</span>
                                                        {cCfg.label}
                                                    </span>
                                                </div>

                                                {/* Action buttons */}
                                                {isPending && (
                                                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex gap-2.5">
                                                        <button
                                                            onClick={() => respond(iv.id, 'CONFIRMED')}
                                                            disabled={respondingId === iv.id}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#00b14f] hover:bg-[#009940] text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-base">thumb_up</span>
                                                            Xác nhận tham gia
                                                        </button>
                                                        <button
                                                            onClick={() => setDeclineModal(iv.id)}
                                                            disabled={respondingId === iv.id}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-bold rounded-lg transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-base">thumb_down</span>
                                                            Từ chối
                                                        </button>
                                                    </div>
                                                )}

                                                {iv.candidateStatus === 'CONFIRMED' && (
                                                    <div className="mt-3.5 pt-3.5 border-t border-slate-100">
                                                        <div className="flex items-center gap-1.5 text-xs text-[#00b14f] font-bold bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/10">
                                                            <span className="material-symbols-outlined text-base">check_circle</span>
                                                            Bạn đã xác nhận tham gia phỏng vấn này. Chúc bạn may mắn! 🎉
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Lịch sử ── */}
                    {others.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">
                                Lịch sử ({others.length})
                            </h2>
                            <div className="space-y-2">
                                {others.map(iv => {
                                    const sCfg = STATUS_CFG[iv.status];
                                    const cCfg = CANDIDATE_CFG[iv.candidateStatus];
                                    const rCfg = RESULT_CFG[iv.result || 'PENDING'];
                                    return (
                                        <div key={iv.id} className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-all">
                                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center p-1 flex-shrink-0">
                                                    {iv.application.job.company.logo
                                                        ? <img src={iv.application.job.company.logo} alt="" className="w-full h-full object-contain rounded" />
                                                        : <span className="text-gray-400 font-bold text-sm">{iv.application.job.company.name[0]}</span>
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-700 truncate">{iv.application.job.title}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{iv.application.job.company.name} · {formatDateTime(iv.scheduledAt)}</p>
                                                    {iv.declineReason && (
                                                        <p className="text-[11px] text-rose-500 mt-1 pl-1 border-l-2 border-rose-300">Lý do từ chối: {iv.declineReason}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border"
                                                    style={{ color: sCfg.color, background: sCfg.bg, borderColor: sCfg.border }}>
                                                    {sCfg.label}
                                                </span>
                                                {iv.candidateStatus === 'DECLINED' ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                                                        style={{ color: cCfg.color, background: cCfg.bg }}>
                                                        {cCfg.label}
                                                    </span>
                                                ) : iv.result !== 'PENDING' ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border"
                                                        style={{ color: rCfg.color, background: rCfg.bg, borderColor: rCfg.border }}>
                                                        {rCfg.label}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                                                        style={{ color: cCfg.color, background: cCfg.bg }}>
                                                        {cCfg.label}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => setSelectedInterview(iv)}
                                                    className="px-2.5 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                    Chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Details modal */}
            {selectedInterview && (
                <DetailsModal
                    interview={selectedInterview}
                    onClose={() => setSelectedInterview(null)}
                    formatDateTime={formatDateTime}
                />
            )}

            {/* Decline modal */}
            {declineModal && (
                <DeclineModal
                    onClose={() => setDeclineModal(null)}
                    onConfirm={reason => respond(declineModal, 'DECLINED', reason)}
                />
            )}
        </div>
    );
}