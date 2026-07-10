'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatDateVi } from '@/lib/jobLabels';
import PrintCvButton from '@/components/PrintCvButton';
import { Resume } from '@/lib/types/candidate/Resume';
import { useResume } from '@/lib/hooks/useResume';
import ButtonDelete from './buttonDelete';
import IsDefault from './isDefault';
import Detailcv from './Detailcv';
import CardCv from './CardCv';

export default function CandidateResumesClient({ initialResumes }: { initialResumes: Resume[] }) {

    const { resumes, setResumes, deleting, handleDelete, handleSetDefault, loading, setLoading } = useResume(initialResumes);


    useEffect(() => {
        setResumes(initialResumes);
        setLoading(false);
    }, [initialResumes]);



    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-gray-500">{resumes.length} hồ sơ đã lưu trên hệ thống</p>
                </div>
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
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {resumes.map(r => (
                        <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex gap-5">
                            {/* Left Side: Big CV Thumbnail */}
                            <div className="w-24 h-32 sm:w-28 sm:h-36 bg-gradient-to-br from-[#00b14f]/10 to-[#041b3c]/5 rounded-xl flex items-center justify-center border border-gray-200 shrink-0 overflow-hidden shadow-sm relative group">
                                {r.template?.thumbnailUrl ? (
                                    <img src={r.template.thumbnailUrl} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                    <span className="material-symbols-outlined text-4xl text-[#00b14f]">description</span>
                                )}
                                {r.isDefault && (
                                    <span className="absolute top-2 left-2 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#00b14f] text-white shadow-sm">
                                        Mặc định
                                    </span>
                                )}
                            </div>

                            {/* Right Side: Information & Actions */}
                            <div className="flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                    {/* Title & Type Badges */}
                                    <h3 className="font-bold text-base sm:text-lg text-[#041b3c] truncate hover:text-[#00b14f] transition-colors flex items-center gap-1.5 flex-wrap">
                                        <a href={`/cv/${r.id}`} target="_blank" rel="noreferrer" title={r.title}>
                                            {r.title}
                                        </a>
                                        {r.isProfile ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#0052cc] text-white shrink-0">
                                                Profile
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white shrink-0">
                                                CV
                                            </span>
                                        )}
                                    </h3>

                                    {/* Template name & Updated date */}
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 items-center text-xs text-gray-400">
                                        {r.template && (
                                            <span className="font-semibold text-[#00b14f]">
                                                Mẫu: {r.template.name}
                                            </span>
                                        )}
                                        <span>•</span>
                                        <span className="flex items-center">
                                            <span className="material-symbols-outlined text-xs mr-0.5 text-[14px]">history</span>
                                            Cập nhật: {formatDateVi(r.updatedAt)}
                                        </span>
                                    </div>

                                    {/* Detail CV details */}
                                    <div className="mt-3">
                                        <Detailcv id={r.id} count={r._count.applications} address={r.address} summary={r.summary} />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100/80 flex-wrap">
                                    <a
                                        href={`/cv/${r.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold text-white bg-[#00b14f] rounded-xl hover:bg-[#009940] transition-all shadow-sm shadow-[#00b14f]/10 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                                        Xem
                                    </a>
                                    <Link
                                        href={`/sua-cv/${r.id}`}
                                        className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200/60 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[15px]">edit</span>
                                        Sửa
                                    </Link>
                                    <PrintCvButton
                                        resumeId={r.id}
                                        className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold text-[#00b14f] bg-white border border-[#00b14f]/30 rounded-xl hover:bg-[#00b14f]/5 transition-all cursor-pointer disabled:opacity-50"
                                    />
                                    <IsDefault id={r.id} handleSetDefault={handleSetDefault} isDefault={r.isDefault} />
                                    <ButtonDelete
                                        id={r.id}
                                        onDelete={handleDelete}
                                        isDeleting={deleting === r.id}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

