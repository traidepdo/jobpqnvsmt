'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatDateVi } from '@/lib/jobLabels';
import PrintCvButton from '@/components/PrintCvButton';
import { Resume } from '@/lib/types/candidate/Resume';

export default function CandidateResumesClient({ initialResumes }: { initialResumes: Resume[] }) {
    const [resumes, setResumes] = useState<Resume[]>(initialResumes);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        setResumes(initialResumes);
        setLoading(false);
    }, [initialResumes]);

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa CV này? Hành động không thể hoàn tác.')) return;
        setDeleting(id);
        try {
            const res = await fetch(`/api/candidate/resumes/${id}`, { method: 'DELETE' });
            if (res.ok) setResumes(prev => prev.filter(r => r.id !== id));
            else alert('Không thể xóa CV');
        } finally {
            setDeleting(null);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const res = await fetch(`/api/candidate/resumes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDefault: true }),
            });
            if (res.ok) {
                setResumes(prev => prev.map(r => ({
                    ...r,
                    isDefault: r.id === id
                })));
            } else {
                alert('Không thể thiết lập CV mặc định');
            }
        } catch (e) {
            console.error(e);
            alert('Đã xảy ra lỗi');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-gray-500">{resumes.length} hồ sơ đã lưu trên hệ thống</p>
                </div>
                <Link
                    href="/tao-cv"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00b14f] hover:bg-[#009940] text-white font-bold rounded-lg text-sm"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Tạo CV mới
                </Link>
            </div>

            {resumes.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">article</span>
                    <p className="font-semibold text-gray-600 mb-1">Chưa có CV nào</p>
                    <p className="text-sm text-gray-400 mb-6">Tạo CV online để ứng tuyển nhanh hơn</p>
                    <Link href="/tao-cv" className="inline-flex px-6 py-2.5 bg-[#00b14f] text-white font-bold rounded-lg text-sm">
                        Bắt đầu tạo CV
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {resumes.map(r => (
                        <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
                            <div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-16 h-20 bg-gradient-to-br from-[#00b14f]/10 to-[#041b3c]/5 rounded-lg flex items-center justify-center border border-gray-100 shrink-0 overflow-hidden">
                                        {r.template?.thumbnailUrl ? (
                                            <img src={r.template.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-3xl text-[#00b14f]">description</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-base md:text-lg text-[#041b3c] truncate hover:text-[#00b14f] transition-colors flex items-center gap-1.5 flex-wrap">
                                            <a href={`/cv/${r.id}`} target="_blank" rel="noreferrer" title={r.title}>
                                                {r.title}
                                            </a>
                                            {r.isDefault && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00b14f] text-white shrink-0">
                                                    Mặc định
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                                            {r.template && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#00b14f]/10 text-[#00b14f]">
                                                    Mẫu: {r.template.name}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center text-xs text-gray-400">
                                                <span className="material-symbols-outlined text-xs mr-1 text-[14px]">history</span>
                                                {formatDateVi(r.updatedAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <span className="material-symbols-outlined text-sm mr-2 text-[18px] text-gray-400">send</span>
                                        <span>Đã ứng tuyển: <strong className="text-[#041b3c]">{r._count.applications} lần</strong></span>
                                    </div>
                                    {r.address && (
                                        <div className="flex items-center text-sm text-gray-500 truncate">
                                            <span className="material-symbols-outlined text-sm mr-2 text-[18px] text-gray-400">location_on</span>
                                            <span>{r.address}</span>
                                        </div>
                                    )}
                                    {r.summary && (
                                        <p className="text-sm text-gray-500 line-clamp-2 mt-2 leading-relaxed bg-gray-50/50 p-2.5 rounded-lg border border-gray-50">
                                            {r.summary}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100 flex-wrap">
                                <a
                                    href={`/cv/${r.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-[#00b14f] rounded-xl hover:bg-[#009940] transition-all shadow-sm shadow-[#00b14f]/10 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                                    Xem CV
                                </a>
                                <Link
                                    href={`/sua-cv/${r.id}`}
                                    className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200/60 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                    Sửa
                                </Link>
                                <PrintCvButton
                                    resumeId={r.id}
                                    className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-[#00b14f] bg-white border border-[#00b14f]/30 rounded-xl hover:bg-[#00b14f]/5 transition-all cursor-pointer disabled:opacity-50"
                                />
                                {!r.isDefault && (
                                    <button
                                        onClick={() => handleSetDefault(r.id)}
                                        className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-cyan-600 bg-cyan-50 border border-cyan-200/60 rounded-xl hover:bg-cyan-100 transition-all cursor-pointer"
                                        title="Đặt làm CV mặc định để nộp nhanh"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                        Mặc định
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(r.id)}
                                    disabled={deleting === r.id}
                                    className="px-3 py-2 text-xs font-semibold text-red-500 bg-red-50/60 hover:bg-red-50 hover:text-red-600 rounded-xl border border-red-100 transition-all cursor-pointer disabled:opacity-50"
                                    title="Xóa CV"
                                >
                                    <span className="material-symbols-outlined text-[16px]">{deleting === r.id ? 'sync' : 'delete'}</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
