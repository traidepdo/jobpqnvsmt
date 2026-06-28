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
        <div className="max-w-5xl space-y-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {resumes.map(r => (
                        <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
                            <div>
                                <CardCv r={r} />
                                <Detailcv id={r.id} count={r._count.applications} address={r.address} summary={r.summary} />
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
                                <IsDefault id={r.id} handleSetDefault={handleSetDefault} isDefault={r.isDefault} />
                                <ButtonDelete
                                    id={r.id}
                                    onDelete={handleDelete}
                                    isDeleting={deleting === r.id}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

