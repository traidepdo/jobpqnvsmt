'use client';

import { useEffect, useState } from 'react';
import type { Application } from '@/lib/types/employer/application';
import { TEMPLATE_MAP } from '@/template/index';
import React from 'react';

export default function CandidateDetailsModal({
    app,
    onClose,
    onBookmark,
    isBookmarked,
    onEvaluate,
}: {
    app: Application;
    onClose: () => void;
    onBookmark: () => void;
    isBookmarked: boolean;
    onEvaluate?: (score: number) => void;
}) {
    const [loadingCv, setLoadingCv] = useState(true);
    const [cvError, setCvError] = useState('');
    const [previewDocument, setPreviewDocument] = useState('');
    const [cvUrl, setCvUrl] = useState<string | null>(null);
    const [nativeResume, setNativeResume] = useState<any>(null);
    const [evaluating, setEvaluating] = useState(false);

    const handleEvaluate = async () => {
        if (evaluating) return;
        setEvaluating(true);
        try {
            const res = await fetch(`/api/employer/applications/${app.id}/evaluate`, {
                method: 'POST',
            });
            if (res.ok) {
                const data = await res.json();
                if (onEvaluate) {
                    onEvaluate(data.score);
                }
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Lỗi khi chấm điểm CV.');
            }
        } catch (e) {
            console.error(e);
            alert('Không thể kết nối đến máy chủ.');
        } finally {
            setEvaluating(false);
        }
    };

    useEffect(() => {
        setLoadingCv(true);
        setCvError('');
        setNativeResume(null);
        setPreviewDocument('');
        setCvUrl(null);

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
                if (d.resumeData) {
                    setNativeResume(d.resumeData);
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
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-[9px] font-black text-slate-450 uppercase tracking-wider block mb-1">AI Match Score</span>
                                <div className="flex items-baseline gap-1">
                                    {app.matchScore !== undefined && app.matchScore !== null ? (
                                        <span className={`text-xl font-black ${app.matchScore >= 75 ? 'text-emerald-600' : app.matchScore >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                            {app.matchScore}%
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-400">
                                            {evaluating ? 'Đang tính...' : 'Chưa chấm'}
                                        </span>
                                    )}
                                </div>
                            </div>
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
                    <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleEvaluate}
                            disabled={evaluating}
                            className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-98 bg-[#0052CC] hover:bg-[#0040a2] text-white disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                neurology
                            </span>
                            {evaluating ? 'Đang chấm điểm AI...' : app.matchScore !== null && app.matchScore !== undefined ? 'Chấm điểm lại bằng AI' : 'Chấm điểm CV bằng AI'}
                        </button>
                        <button
                            type="button"
                            onClick={onBookmark}
                            className={`w-full h-11 inline-flex items-center justify-center gap-2 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-98
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
                        ) : previewDocument ? (
                            <div className="w-full h-full overflow-hidden relative">
                                <iframe
                                    id="cv-preview-iframe"
                                    srcDoc={previewDocument}
                                    className="border-none bg-white absolute top-0 left-0 w-full h-full"
                                    title="CV Preview"
                                    sandbox="allow-scripts allow-same-origin"
                                />
                                 {/* View details button instead of download */}
                                 {cvUrl && cvUrl.startsWith('/cv/') && (
                                     <div className="absolute bottom-6 right-6 z-20">
                                         <a
                                             href={cvUrl.replace('/cv/', '/employer-cv/')}
                                             target="_blank"
                                             rel="noreferrer"
                                             className="flex items-center gap-2 bg-[#0052CC] hover:bg-[#0040a2] text-white font-bold px-5 py-3 rounded-full shadow-lg transition transform hover:scale-105 active:scale-95 text-xs cursor-pointer border-none no-underline"
                                         >
                                             <span className="material-symbols-outlined text-sm">visibility</span>
                                             Xem chi tiết CV
                                         </a>
                                     </div>
                                 )}
                            </div>
                        ) : nativeResume ? (
                            <div className="absolute top-0 left-0 w-full h-full bg-slate-50 flex flex-col">
                                <div className="flex-1 w-full overflow-y-auto p-6 flex justify-center employer-cv-readonly-mode">
                                    <style dangerouslySetInnerHTML={{
                                        __html: `
                                        .employer-cv-readonly-mode input,
                                        .employer-cv-readonly-mode textarea {
                                            pointer-events: none !important;
                                            cursor: default !important;
                                            background: transparent !important;
                                            border: none !important;
                                            outline: none !important;
                                            box-shadow: none !important;
                                            resize: none !important;
                                            color: inherit !important;
                                            font-family: inherit !important;
                                            font-weight: inherit !important;
                                            padding: 0 !important;
                                        }
                                        .employer-cv-readonly-mode button,
                                        .employer-cv-readonly-mode label.cursor-pointer,
                                        .employer-cv-readonly-mode .print\\:hidden,
                                        .employer-cv-readonly-mode [class*="print:hidden"],
                                        .employer-cv-readonly-mode [class*="bg-stone-800"]:first-child:not([class*="px-10"]),
                                        .employer-cv-readonly-mode div[class*="border-stone-200"]:first-child {
                                            display: none !important;
                                        }
                                        .employer-cv-readonly-mode .min-h-screen {
                                            padding: 0 !important;
                                            background-color: transparent !important;
                                        }
                                        .employer-cv-readonly-mode::-webkit-scrollbar {
                                            width: 5px;
                                            height: 5px;
                                        }
                                        .employer-cv-readonly-mode::-webkit-scrollbar-track {
                                            background: transparent;
                                        }
                                        .employer-cv-readonly-mode::-webkit-scrollbar-thumb {
                                            background: #cbd5e1;
                                            border-radius: 99px;
                                        }
                                        .employer-cv-readonly-mode::-webkit-scrollbar-thumb:hover {
                                            background: #94a3b8;
                                        }
                                        `
                                    }} />
                                    <div className="w-[656px] overflow-visible flex-shrink-0 self-start">
                                        <div 
                                            className="employer-cv-download-target w-[820px] origin-top-left bg-white shadow-md rounded-sm overflow-hidden p-6"
                                            style={{
                                                transform: 'scale(0.8)',
                                            }}
                                        >
                                            {React.createElement((TEMPLATE_MAP as any)[nativeResume.slug], {
                                                user: nativeResume.user,
                                                resume: nativeResume.resumeDetails,
                                            })}
                                        </div>
                                    </div>
                                </div>
                                {/* View CV Details Button cho native resume */}
                                <div className="absolute bottom-6 right-6 z-25">
                                    <ViewNativeResumeButton
                                        resumeId={nativeResume?.id}
                                    />
                                </div>
                            </div>
                        ) : cvUrl ? (
                            <div className="w-full h-full overflow-hidden relative">
                                <iframe
                                    id="cv-preview-iframe"
                                    src={cvUrl}
                                    className="border-none bg-white absolute top-0 left-0 w-full h-full"
                                    title="CV Preview"
                                    sandbox="allow-scripts allow-same-origin"
                                />
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

/* ── Button xem chi tiết CV cho native resume trong modal ── */
function ViewNativeResumeButton({ resumeId }: { resumeId: string }) {
    const handleView = () => {
        if (!resumeId) {
            alert('Không tìm thấy ID của CV.');
            return;
        }
        window.open(`/employer-cv/${resumeId}`, '_blank');
    };

    return (
        <button
            type="button"
            onClick={handleView}
            className="flex items-center gap-2 bg-[#0052CC] hover:bg-[#0040a2] text-white font-bold px-5 py-3 rounded-full shadow-lg transition transform hover:scale-105 active:scale-95 text-xs cursor-pointer border-none"
        >
            <span className="material-symbols-outlined text-sm">visibility</span>
            Xem chi tiết CV
        </button>
    );
}
