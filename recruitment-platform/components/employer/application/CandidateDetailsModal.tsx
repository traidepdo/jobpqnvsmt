'use client';

import { useEffect, useState } from 'react';
import type { Application } from '@/lib/types/employer/application';

export default function CandidateDetailsModal({
    app,
    onClose,
    onBookmark,
    isBookmarked,
}: {
    app: Application;
    onClose: () => void;
    onBookmark: () => void;
    isBookmarked: boolean;
}) {
    const [loadingCv, setLoadingCv] = useState(true);
    const [cvError, setCvError] = useState('');
    const [previewDocument, setPreviewDocument] = useState('');
    const [cvUrl, setCvUrl] = useState<string | null>(null);

    useEffect(() => {
        setLoadingCv(true);
        setCvError('');
        
        fetch(`/api/employer/applications/${app.id}/cv`)
            .then(async r => {
                const d = await r.json();
                if (!r.ok) {
                    setCvError(d.error || 'Không tải được CV');
                    return;
                }
                if (d.previewDocument) {
                    setPreviewDocument(d.previewDocument);
                }
                if (d.cvUrl) {
                    setCvUrl(d.cvUrl);
                }
            })
            .catch(() => setCvError('Lỗi kết nối máy chủ'))
            .finally(() => setLoadingCv(false));
    }, [app.id]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col md:flex-row overflow-hidden border border-slate-100" onClick={e => e.stopPropagation()}>
                {/* Left Side: Candidate Profile Details */}
                <div className="w-full md:w-5/12 p-6 flex flex-col justify-between border-r border-slate-100 overflow-y-auto scrollbar-thin space-y-6">
                    {/* Header info */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-650">
                                Chi tiết ứng viên
                            </span>
                            <button type="button" onClick={onClose} className="md:hidden w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        {/* Avatar & Basic Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0052CC] to-[#0040a2] flex items-center justify-center text-white font-black text-2xl overflow-hidden shadow-sm flex-shrink-0">
                                {app.user.avatar ? (
                                    <img src={app.user.avatar} alt={app.user.name} className="w-full h-full object-cover" />
                                ) : (
                                    app.user.name[0]?.toUpperCase()
                                )}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-black text-slate-900 leading-tight">{app.user.name}</h3>
                                <p className="text-xs text-slate-400 font-bold mt-1">{app.job.title}</p>
                            </div>
                        </div>

                        {/* Stats/Scores */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            {app.matchScore !== undefined && app.matchScore !== null && (
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block mb-1">AI Match Score</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-xl font-black ${app.matchScore >= 75 ? 'text-emerald-600' : app.matchScore >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                            {app.matchScore}%
                                        </span>
                                    </div>
                                </div>
                            )}
                            {app.quizScore !== undefined && app.quizScore !== null && (
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block mb-1">Quiz Score</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-black text-blue-600">
                                            {app.quizScore}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Contact details */}
                        <div className="space-y-3 pt-2">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Thông tin liên lạc</h4>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2.5 text-slate-650">
                                    <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                                    <a href={`mailto:${app.user.email}`} className="font-semibold hover:text-[#0052CC] hover:underline truncate">
                                        {app.user.email}
                                    </a>
                                </div>
                                {app.user.phone && (
                                    <div className="flex items-center gap-2.5 text-slate-650">
                                        <span className="material-symbols-outlined text-[16px] text-slate-400">call</span>
                                        <a href={`tel:${app.user.phone}`} className="font-semibold hover:text-[#0052CC] hover:underline">
                                            {app.user.phone}
                                        </a>
                                    </div>
                                )}
                                <div className="flex items-center gap-2.5 text-slate-650">
                                    <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                                    <span className="font-semibold">
                                        Nộp ngày: {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Cover letter */}
                        {app.coverLetter && (
                            <div className="space-y-2 pt-2">
                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Thư giới thiệu</h4>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-line font-medium">
                                    {app.coverLetter}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bookmark Actions Footer */}
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onBookmark}
                            className={`flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-98
                                ${isBookmarked
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-500'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {isBookmarked ? 'bookmark' : 'bookmark_border'}
                            </span>
                            {isBookmarked ? 'Đã lưu hồ sơ' : 'Lưu hồ sơ tiềm năng'}
                        </button>
                    </div>
                </div>

                {/* Right Side: CV Preview */}
                <div className="hidden md:flex flex-1 bg-slate-50 flex-col relative h-full">
                    {/* Header bar for CV preview */}
                    <div className="h-14 px-6 border-b border-slate-100 bg-white flex items-center justify-between z-10">
                        <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-slate-450">description</span>
                            Xem trước CV ứng tuyển
                        </span>
                        <div className="flex items-center gap-2.5">
                            <button type="button" onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-650 transition-colors cursor-pointer">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>
                    </div>

                    {/* IFrame container */}
                    <div className="flex-1 w-full bg-slate-100 relative">
                        {loadingCv ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50/80">
                                <div className="w-8 h-8 border-3 border-slate-200 border-t-[#0052CC] rounded-full animate-spin" />
                                <p className="text-xs text-slate-400 font-bold">Đang tải CV...</p>
                            </div>
                        ) : cvError ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white">
                                <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">description</span>
                                <p className="text-xs font-bold text-slate-500">{cvError}</p>
                                {cvUrl && (
                                    <a
                                        href={cvUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-4 px-4 py-2 bg-[#0052CC] hover:bg-[#0040a2] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                                    >
                                        Tải tệp tin CV
                                    </a>
                                )}
                            </div>
                        ) : previewDocument || cvUrl ? (
                            <div className="w-full h-full overflow-hidden relative">
                                <iframe
                                    id="cv-preview-iframe"
                                    src={cvUrl || undefined}
                                    srcDoc={previewDocument || undefined}
                                    className="border-none bg-white absolute top-0 left-0"
                                    style={{
                                        width: '125%',
                                        height: '125%',
                                        transform: 'scale(0.8)',
                                        transformOrigin: 'top left',
                                    }}
                                    title="CV Preview"
                                    sandbox="allow-scripts"
                                />
                                {/* Floating Print/Download Button (Overlaid on bottom right) */}
                                <div className="absolute bottom-6 right-6 z-20">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (cvUrl) {
                                                window.open(cvUrl + '&print=true', '_blank');
                                            }
                                        }}
                                        className="flex items-center gap-2 bg-[#00b14f] hover:bg-[#009940] text-white font-bold px-5 py-3 rounded-full shadow-lg transition transform hover:scale-105 active:scale-95 text-xs cursor-pointer border-none"
                                    >
                                        <span className="material-symbols-outlined text-sm">print</span>
                                        Tải xuống / In PDF
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white">
                                <span className="material-symbols-outlined text-4xl mb-2">find_in_page</span>
                                <p className="text-xs font-bold">Không tìm thấy tài liệu CV</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
