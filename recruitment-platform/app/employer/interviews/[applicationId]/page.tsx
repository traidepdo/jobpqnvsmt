'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type InterviewType = 'ONLINE' | 'OFFLINE';
type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
type CandidateInterviewStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED';

interface CandidateInfo {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
}

interface ApplicationDetail {
    id: string;
    jobTitle: string;
    jobId: string;
    appliedAt: string;
    interview: InterviewDetail | null;
}

interface InterviewDetail {
    id: string;
    scheduledAt: string;
    type: InterviewType;
    location: string;
    notes: string | null;
    status: InterviewStatus;
    candidateStatus: CandidateInterviewStatus;
    declineReason: string | null;
}

type FormState = {
    scheduledAt: string;
    type: InterviewType;
    location: string;
    notes: string;
};

const STATUS_CFG: Record<InterviewStatus, { label: string; bg: string; text: string; icon: string }> = {
    SCHEDULED: { label: 'Đã lên lịch', bg: 'bg-blue-50/70 text-blue-700 border-blue-100', text: '', icon: 'calendar_today' },
    COMPLETED: { label: 'Hoàn thành', bg: 'bg-emerald-50/70 text-emerald-700 border-emerald-100', text: '', icon: 'check_circle' },
    CANCELLED: { label: 'Đã hủy', bg: 'bg-rose-50/70 text-rose-700 border-rose-100', text: '', icon: 'cancel' },
};

const CANDIDATE_CFG: Record<CandidateInterviewStatus, { label: string; bg: string; text: string; icon: string }> = {
    PENDING: { label: 'Chờ xác nhận', bg: 'bg-amber-50/70 text-amber-700 border-amber-100', text: '', icon: 'hourglass_empty' },
    CONFIRMED: { label: 'Đã xác nhận', bg: 'bg-emerald-50/70 text-emerald-700 border-emerald-100', text: '', icon: 'thumb_up' },
    DECLINED: { label: 'Từ chối', bg: 'bg-rose-50/70 text-rose-700 border-rose-100', text: '', icon: 'thumb_down' },
};

const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.toLocaleDateString('vi-VN', { weekday: 'long' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${day}, ${date} lúc ${time}`;
};

const toDatetimeLocal = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

const defaultForm = (): FormState => ({
    scheduledAt: '', type: 'ONLINE', location: '', notes: '',
});

export default function InterviewDetailPage() {
    const router = useRouter();
    const params = useParams();
    const applicationId = params.applicationId as string;

    const [candidate, setCandidate] = useState<CandidateInfo | null>(null);
    const [application, setApplication] = useState<ApplicationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<FormState>(defaultForm());
    const [saving, setSaving] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/employer/interviews/application/${applicationId}`);
            if (!res.ok) { router.push('/employer/interviews'); return; }
            const data = await res.json();
            setCandidate(data.candidate);
            setApplication(data.application);

            // Pre-fill form if scheduled
            if (data.application?.interview) {
                const iv: InterviewDetail = data.application.interview;
                setForm({
                    scheduledAt: toDatetimeLocal(iv.scheduledAt),
                    type: iv.type,
                    location: iv.location,
                    notes: iv.notes ?? '',
                });
            } else {
                setForm(defaultForm());
                setFormOpen(true);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [applicationId]);

    const handleSave = async () => {
        if (!form.scheduledAt || !form.location) {
            setError('Vui lòng điền đầy đủ ngày giờ và địa điểm'); return;
        }
        setSaving(true); setError(''); setSuccessMsg('');
        try {
            const isEdit = !!application?.interview;
            const res = isEdit
                ? await fetch(`/api/employer/interviews/${application!.interview!.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                })
                : await fetch('/api/employer/interviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ applicationId, ...form }),
                });

            if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Lỗi khi lưu'); return; }
            setSuccessMsg(isEdit ? 'Đã cập nhật lịch phỏng vấn!' : 'Đã đặt lịch thành công!');
            setFormOpen(false);
            await load();
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateStatus = async (status: InterviewStatus) => {
        if (!application?.interview) return;
        setUpdatingStatus(true); setSuccessMsg('');
        const res = await fetch(`/api/employer/interviews/${application.interview.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (res.ok) {
            setSuccessMsg(status === 'COMPLETED' ? 'Đã đánh dấu hoàn thành!' : 'Đã hủy lịch phỏng vấn!');
            await load();
        }
        setUpdatingStatus(false);
    };

    if (loading) return (
        <div className="flex flex-col justify-center items-center py-40 space-y-4">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-[#0052CC] rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-bold tracking-wider">Đang tải lịch phỏng vấn...</p>
        </div>
    );

    if (!candidate || !application) return null;

    const iv = application.interview;
    const hasScheduled = iv?.status === 'SCHEDULED';

    return (
        <div className="max-w-3xl mx-auto space-y-6 px-4 py-6 text-slate-800 animate-fadeIn">
            {/* Elegant Header with Back Button */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.push('/employer/interviews')}
                    className="group inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl shadow-sm text-xs font-bold text-slate-500 hover:text-[#0052CC] transition-all duration-200 cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                    Quay lại danh sách
                </button>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-450">
                    Chi tiết phỏng vấn
                </div>
            </div>

            {/* Candidate & Job Premium Card */}
            <div className="relative overflow-hidden bg-white rounded-3xl p-6 shadow-sm border border-slate-100/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#0052CC]/5 to-[#6554C0]/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0052CC] to-[#0040a2] flex items-center justify-center text-white font-black text-2xl flex-shrink-0 overflow-hidden shadow-md shadow-[#0052CC]/10">
                        {candidate.avatar
                            ? <img src={candidate.avatar} className="w-full h-full object-cover animate-scaleIn" alt={candidate.name} />
                            : candidate.name[0]?.toUpperCase()}
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">{candidate.name}</h1>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <a href={`mailto:${candidate.email}`}
                                className="flex items-center gap-1 text-xs text-slate-450 hover:text-[#0052CC] font-semibold transition-colors">
                                <span className="material-symbols-outlined text-[13px]">mail</span>
                                {candidate.email}
                            </a>
                            {candidate.phone && (
                                <a href={`tel:${candidate.phone}`}
                                    className="flex items-center gap-1 text-xs text-slate-450 hover:text-[#0052CC] font-semibold transition-colors">
                                    <span className="material-symbols-outlined text-[13px]">call</span>
                                    {candidate.phone}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Job / Application Details Box */}
                <div className="bg-slate-50/60 rounded-2xl p-4 md:text-right flex flex-col gap-1 min-w-[200px] border border-slate-100">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Vị trí ứng tuyển</span>
                    <p className="font-extrabold text-slate-800 text-sm">{application.jobTitle}</p>
                    <div className="text-[10px] text-slate-450 font-bold mt-1">
                        Nộp hồ sơ: {new Date(application.appliedAt).toLocaleDateString('vi-VN')}
                    </div>
                </div>
            </div>

            {/* Micro-animated Alerts */}
            {error && (
                <div className="px-5 py-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-3 animate-slideUp">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError('')} className="w-6 h-6 rounded-lg hover:bg-rose-100 text-rose-400 hover:text-rose-700 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                </div>
            )}
            
            {successMsg && (
                <div className="px-5 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-bold text-emerald-700 flex items-center gap-3 animate-slideUp">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span className="flex-1">{successMsg}</span>
                    <button onClick={() => setSuccessMsg('')} className="w-6 h-6 rounded-lg hover:bg-emerald-100 text-emerald-400 hover:text-emerald-700 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                </div>
            )}

            {/* Main Schedule Container */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Section Header */}
                <div className="px-6 py-5 flex flex-wrap items-center justify-between border-b border-slate-50 gap-4 bg-gradient-to-r from-slate-50/50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#0052CC]/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[16px] text-[#0052CC] font-bold">event</span>
                        </div>
                        <h2 className="font-black text-slate-800 text-sm">Lịch Hẹn Phỏng Vấn</h2>
                    </div>

                    {iv && (
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${STATUS_CFG[iv.status].bg} ${STATUS_CFG[iv.status].text}`}>
                                <span className="material-symbols-outlined text-[12px]">{STATUS_CFG[iv.status].icon}</span>
                                {STATUS_CFG[iv.status].label}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${CANDIDATE_CFG[iv.candidateStatus].bg} ${CANDIDATE_CFG[iv.candidateStatus].text}`}>
                                <span className="material-symbols-outlined text-[12px]">{CANDIDATE_CFG[iv.candidateStatus].icon}</span>
                                {CANDIDATE_CFG[iv.candidateStatus].label}
                            </span>
                        </div>
                    )}
                </div>

                {/* Display Mode (Lịch hiện tại) */}
                {iv && !formOpen && (
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Date Card */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50 flex items-start gap-3.5 hover:shadow-sm transition-all duration-200">
                                <span className="material-symbols-outlined text-[20px] text-slate-400 bg-white p-2 rounded-xl shadow-sm">schedule</span>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Thời gian phỏng vấn</p>
                                    <p className="text-sm font-extrabold text-slate-800">{formatDateTime(iv.scheduledAt)}</p>
                                </div>
                            </div>

                            {/* Format Card */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50 flex items-start gap-3.5 hover:shadow-sm transition-all duration-200">
                                <span className="material-symbols-outlined text-[20px] text-slate-400 bg-white p-2 rounded-xl shadow-sm">
                                    {iv.type === 'ONLINE' ? 'videocam' : 'location_on'}
                                </span>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Hình thức</p>
                                    <p className="text-sm font-extrabold text-slate-800">{iv.type === 'ONLINE' ? 'Online qua Google Meet / Zoom' : 'Trực tiếp tại văn phòng'}</p>
                                </div>
                            </div>

                            {/* Location Link Card */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50 flex items-start gap-3.5 hover:shadow-sm transition-all duration-200 sm:col-span-2">
                                <span className="material-symbols-outlined text-[20px] text-slate-400 bg-white p-2 rounded-xl shadow-sm">pin_drop</span>
                                <div className="space-y-0.5 min-w-0 flex-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                        {iv.type === 'ONLINE' ? 'Đường dẫn phòng họp trực tuyến' : 'Địa điểm tổ chức'}
                                    </p>
                                    {iv.type === 'ONLINE' ? (
                                        <a href={iv.location} target="_blank" rel="noreferrer" className="text-sm font-extrabold text-[#0052CC] hover:underline break-all block">
                                            {iv.location}
                                        </a>
                                    ) : (
                                        <p className="text-sm font-extrabold text-slate-800 break-all">{iv.location}</p>
                                    )}
                                </div>
                            </div>

                            {/* Notes Card */}
                            {iv.notes && (
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50 flex items-start gap-3.5 hover:shadow-sm transition-all duration-200 sm:col-span-2">
                                    <span className="material-symbols-outlined text-[20px] text-slate-400 bg-white p-2 rounded-xl shadow-sm">notes</span>
                                    <div className="space-y-0.5 flex-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Ghi chú bổ sung</p>
                                        <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line">{iv.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Candidate Declined Section */}
                        {iv.candidateStatus === 'DECLINED' && iv.declineReason && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                                <span className="material-symbols-outlined text-rose-500 mt-0.5 text-[18px]">sentiment_very_dissatisfied</span>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-rose-600 uppercase tracking-wider">Lý do ứng viên từ chối phỏng vấn</p>
                                    <p className="text-xs text-rose-800 font-bold leading-normal">{iv.declineReason}</p>
                                </div>
                            </div>
                        )}

                        {/* Top-level Action Buttons */}
                        {hasScheduled && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                                <button
                                    onClick={() => setFormOpen(true)}
                                    className="h-10 px-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#0052CC] hover:text-[#0040a2] border border-[#0052CC]/20 hover:border-[#0052CC]/40 hover:bg-[#0052CC]/5 rounded-xl cursor-pointer transition-all duration-200 shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                    Sửa lịch phỏng vấn
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus('COMPLETED')}
                                    disabled={updatingStatus}
                                    className="h-10 px-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded-xl cursor-pointer transition-all duration-200 shadow-sm disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                    Hoàn thành
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus('CANCELLED')}
                                    disabled={updatingStatus}
                                    className="h-10 px-4 inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 border border-rose-200 hover:bg-rose-50 rounded-xl cursor-pointer transition-all duration-200 shadow-sm disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                                    Hủy lịch hẹn
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Edit/Create Form Mode */}
                {(!iv || formOpen) && (
                    <div className="p-6 space-y-5 bg-slate-50/20">
                        {iv && (
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC] animate-ping" />
                                <p className="text-xs font-black text-[#0052CC] uppercase tracking-wider">Hiệu chỉnh thông tin lịch hẹn</p>
                            </div>
                        )}

                        {/* Date Picker Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-550 block">
                                Ngày & Giờ Gặp <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    value={form.scheduledAt}
                                    onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
                                    className="w-full h-11 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10 bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Format Switcher */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-550 block">Hình thức phỏng vấn</label>
                            <div className="flex gap-3">
                                {(['ONLINE', 'OFFLINE'] as InterviewType[]).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setForm(p => ({ ...p, type: t }))}
                                        className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm
                                            ${form.type === t
                                                ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-md shadow-[#0052CC]/10'
                                                : 'border-slate-250 text-slate-600 hover:border-[#0052CC] hover:text-[#0052CC] bg-white'}`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            {t === 'ONLINE' ? 'videocam' : 'location_on'}
                                        </span>
                                        {t === 'ONLINE' ? 'Trực tuyến (Meet/Zoom)' : 'Trực tiếp (Tại VP)'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Location Text Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-550 block">
                                {form.type === 'ONLINE' ? 'Đường dẫn liên kết cuộc họp (Google Meet/Zoom/Teams...)' : 'Địa chỉ chi tiết văn phòng'}
                                <span className="text-rose-500"> *</span>
                            </label>
                            <input
                                type="text"
                                value={form.location}
                                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                                placeholder={form.type === 'ONLINE' ? 'https://meet.google.com/abc-defg-hij' : 'Ví dụ: Tầng 5, Tòa nhà A, Số 123 Đường B, Quận C'}
                                className="w-full h-11 px-4 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10 bg-white transition-all placeholder-slate-400 font-medium"
                            />
                        </div>

                        {/* Notes Area Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-550 block">Lời nhắn/Ghi chú cho ứng viên (không bắt buộc)</label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Ví dụ: Bạn vui lòng mang theo laptop và chuẩn bị sẵn CV bản in. Liên hệ lễ tân khi đến..."
                                rows={4}
                                className="w-full p-4 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10 bg-white resize-none transition-all placeholder-slate-400 font-medium leading-relaxed"
                            />
                        </div>

                        {/* Action buttons footer */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            {iv && (
                                <button
                                    type="button"
                                    onClick={() => { setFormOpen(false); setError(''); }}
                                    className="h-10 px-5 text-xs font-bold text-slate-500 hover:text-slate-750 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="h-10 px-6 inline-flex items-center justify-center gap-1.5 bg-[#0052CC] hover:bg-[#0040a2] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50"
                            >
                                {saving ? (
                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                )}
                                {saving ? 'Đang lưu...' : iv ? 'Cập nhật lịch hẹn' : 'Thiết lập lịch phỏng vấn'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}