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

const STATUS_CFG: Record<InterviewStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
    SCHEDULED: { label: 'Đã lên lịch', color: '#0052CC', bg: '#EFF4FF', border: '#C7D9FF', icon: 'event' },
    COMPLETED: { label: 'Hoàn thành', color: '#00875A', bg: '#E3FCEF', border: '#ABF5D1', icon: 'check_circle' },
    CANCELLED: { label: 'Đã hủy', color: '#DE350B', bg: '#FFEBE6', border: '#FFBDAD', icon: 'cancel' },
};

const CANDIDATE_CFG: Record<CandidateInterviewStatus, { label: string; color: string; bg: string; icon: string }> = {
    PENDING: { label: 'Chờ xác nhận', color: '#FF8B00', bg: '#FFFAE6', icon: 'hourglass_empty' },
    CONFIRMED: { label: 'Đã xác nhận', color: '#00875A', bg: '#E3FCEF', icon: 'thumb_up' },
    DECLINED: { label: 'Từ chối', color: '#DE350B', bg: '#FFEBE6', icon: 'thumb_down' },
};

const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('vi-VN', {
        weekday: 'long', day: '2-digit', month: '2-digit',
        year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

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

            // Pre-fill form nếu đã có lịch
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
                // Tự mở form nếu chưa có lịch
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
        <div className="flex justify-center items-center py-32">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#0052CC] rounded-full animate-spin" />
        </div>
    );

    if (!candidate || !application) return null;

    const iv = application.interview;
    const hasScheduled = iv?.status === 'SCHEDULED';

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            {/* Back */}
            <button
                onClick={() => router.push('/employer/interviews')}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#0052CC] transition-colors"
            >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Quay lại danh sách
            </button>

            {/* Candidate card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0052CC] to-[#6554C0] flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden">
                        {candidate.avatar
                            ? <img src={candidate.avatar} className="w-full h-full object-cover" alt={candidate.name} />
                            : candidate.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-[#041b3c]">{candidate.name}</h1>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            <a href={`mailto:${candidate.email}`}
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#0052CC] transition-colors">
                                <span className="material-symbols-outlined text-[14px]">mail</span>
                                {candidate.email}
                            </a>
                            {candidate.phone && (
                                <a href={`tel:${candidate.phone}`}
                                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#0052CC] transition-colors">
                                    <span className="material-symbols-outlined text-[14px]">call</span>
                                    {candidate.phone}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Job info */}
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#0052CC]">work</span>
                    <p className="font-semibold text-[#041b3c] text-sm">{application.jobTitle}</p>
                    <span className="ml-auto text-xs text-gray-400">
                        Ứng tuyển {new Date(application.appliedAt).toLocaleDateString('vi-VN')}
                    </span>
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {error}
                    <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>
            )}
            {successMsg && (
                <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    {successMsg}
                    <button onClick={() => setSuccessMsg('')} className="ml-auto text-green-400 hover:text-green-600">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>
            )}

            {/* Interview section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#0052CC]/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[15px] text-[#0052CC]">event</span>
                        </div>
                        <h2 className="font-bold text-[#041b3c] text-sm">Lịch phỏng vấn</h2>
                    </div>

                    {iv && (
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1"
                                style={{ color: STATUS_CFG[iv.status].color, background: STATUS_CFG[iv.status].bg, borderColor: STATUS_CFG[iv.status].border }}>
                                <span className="material-symbols-outlined text-[13px]">{STATUS_CFG[iv.status].icon}</span>
                                {STATUS_CFG[iv.status].label}
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                                style={{ color: CANDIDATE_CFG[iv.candidateStatus].color, background: CANDIDATE_CFG[iv.candidateStatus].bg }}>
                                <span className="material-symbols-outlined text-[13px]">{CANDIDATE_CFG[iv.candidateStatus].icon}</span>
                                {CANDIDATE_CFG[iv.candidateStatus].label}
                            </span>
                        </div>
                    )}
                </div>

                {/* Existing interview info */}
                {iv && !formOpen && (
                    <div className="px-5 py-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-start gap-2.5">
                                <span className="material-symbols-outlined text-[16px] text-gray-400 mt-0.5">schedule</span>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Thời gian</p>
                                    <p className="text-sm font-semibold text-[#041b3c]">{formatDateTime(iv.scheduledAt)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <span className="material-symbols-outlined text-[16px] text-gray-400 mt-0.5">
                                    {iv.type === 'ONLINE' ? 'videocam' : 'location_on'}
                                </span>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Hình thức</p>
                                    <p className="text-sm font-semibold text-[#041b3c]">{iv.type === 'ONLINE' ? 'Online' : 'Trực tiếp'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5 sm:col-span-2">
                                <span className="material-symbols-outlined text-[16px] text-gray-400 mt-0.5">pin_drop</span>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                                        {iv.type === 'ONLINE' ? 'Link' : 'Địa chỉ'}
                                    </p>
                                    <p className="text-sm text-[#041b3c] break-all">{iv.location}</p>
                                </div>
                            </div>
                            {iv.notes && (
                                <div className="flex items-start gap-2.5 sm:col-span-2">
                                    <span className="material-symbols-outlined text-[16px] text-gray-400 mt-0.5">notes</span>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Ghi chú</p>
                                        <p className="text-sm text-gray-600">{iv.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {iv.candidateStatus === 'DECLINED' && iv.declineReason && (
                            <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                                <span className="font-semibold">Lý do từ chối:</span> {iv.declineReason}
                            </div>
                        )}

                        {/* Actions */}
                        {hasScheduled && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                    onClick={() => setFormOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0052CC] border border-[#0052CC]/30 hover:bg-[#0052CC]/5 rounded-xl transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[14px]">edit</span>
                                    Sửa lịch
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus('COMPLETED')}
                                    disabled={updatingStatus}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-200 hover:bg-green-50 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                    Hoàn thành
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus('CANCELLED')}
                                    disabled={updatingStatus}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-[14px]">cancel</span>
                                    Hủy lịch
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Form đặt / sửa lịch */}
                {(!iv || formOpen) && (
                    <div className="px-5 py-4 space-y-4 bg-gray-50/40">
                        {iv && (
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cập nhật lịch phỏng vấn</p>
                        )}

                        {/* Ngày giờ */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                                Ngày & giờ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={form.scheduledAt}
                                onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10 bg-white"
                            />
                        </div>

                        {/* Hình thức */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Hình thức</label>
                            <div className="flex gap-3">
                                {(['ONLINE', 'OFFLINE'] as InterviewType[]).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setForm(p => ({ ...p, type: t }))}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all
                                            ${form.type === t
                                                ? 'bg-[#0052CC] text-white border-[#0052CC]'
                                                : 'border-gray-200 text-gray-500 hover:border-[#0052CC] hover:text-[#0052CC] bg-white'}`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            {t === 'ONLINE' ? 'videocam' : 'location_on'}
                                        </span>
                                        {t === 'ONLINE' ? 'Online' : 'Trực tiếp'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                                {form.type === 'ONLINE' ? 'Link Google Meet / Zoom' : 'Địa chỉ văn phòng'}
                                <span className="text-red-500"> *</span>
                            </label>
                            <input
                                type="text"
                                value={form.location}
                                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                                placeholder={form.type === 'ONLINE' ? 'https://meet.google.com/...' : 'Số nhà, đường, quận...'}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10 bg-white"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Ghi chú (tuỳ chọn)</label>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Hướng dẫn thêm cho ứng viên..."
                                rows={3}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10 bg-white resize-none"
                            />
                        </div>

                        {/* Footer buttons */}
                        <div className="flex items-center justify-end gap-3 pt-1">
                            {iv && (
                                <button
                                    onClick={() => { setFormOpen(false); setError(''); }}
                                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Hủy
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 bg-[#0052CC] hover:bg-[#0040a2] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    {saving ? 'hourglass_empty' : 'check'}
                                </span>
                                {saving ? 'Đang lưu...' : iv ? 'Cập nhật' : 'Đặt lịch'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}