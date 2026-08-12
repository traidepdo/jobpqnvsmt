'use client'

import { startTransition, useEffect, useActionState, useState } from "react";
import { getIsBookmark, handleBookmark, updateApplicationStatus } from "@/server/actions/employer/candidateBookmark.action";
import { getApplication } from "@/server/actions/employer/application.action";

function CvPreviewModal({ applicationId, candidateName, onClose }: { applicationId: string; candidateName: string; onClose: () => void }) {
    const [resumeData, setResumeData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getApplication()
            .then(res => {
                if (res.success && res.data) {
                    const apps = res.data || [];
                    const currentApp = apps.find((a: any) => a.id === applicationId);
                    if (currentApp?.resume) {
                        setResumeData(currentApp.resume);
                    }
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [applicationId]);

    const edu = parseResumeJson<EducationItem>(resumeData?.education);
    const exp = parseResumeJson<ExperienceItem>(resumeData?.experience);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-150">
                {/* Header - No border, soft background */}
                <div className="p-4 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#0052CC]">account_circle</span>
                        Chi tiết CV: {candidateName}
                    </h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 cursor-pointer">
                        <span className="material-symbols-outlined block">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-gray-450">Đang tải chi tiết CV...</div>
                    ) : !resumeData ? (
                        <div className="py-10 text-center text-sm text-gray-500 italic">Không tìm thấy dữ liệu CV hệ thống của ứng viên này.</div>
                    ) : (
                        <>
                            <div>
                                <h3 className="text-lg font-bold text-[#041b3c]">{resumeData.title || "CV chưa đặt tên"}</h3>
                                {resumeData.address && <p className="text-xs text-gray-500 mt-0.5">📍 Địa chỉ: {resumeData.address}</p>}
                                {resumeData.summary && (
                                    <div className="mt-3 p-4 bg-slate-50 rounded-xl">
                                        <p className="text-sm text-slate-650 italic">"{resumeData.summary}"</p>
                                    </div>
                                )}
                            </div>

                            {edu.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 pb-1">
                                        <span className="material-symbols-outlined text-[18px] text-[#0052CC]">school</span> Học vấn
                                    </h4>
                                    {edu.map((item, index) => (
                                        <div key={index} className="text-sm bg-slate-50/50 p-3 rounded-xl">
                                            <p className="font-semibold text-gray-800">{item.school}</p>
                                            <p className="text-xs text-gray-500">Chuyên ngành: {item.major || "Chưa cập nhật"} | {item.startDate} - {item.endDate}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {exp.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 pb-1">
                                        <span className="material-symbols-outlined text-[18px] text-[#0052CC]">work</span> Kinh nghiệm làm việc
                                    </h4>
                                    {exp.map((item, index) => (
                                        <div key={index} className="text-sm bg-slate-50/50 p-3 rounded-xl">
                                            <p className="font-semibold text-gray-800">{item.position}</p>
                                            <p className="text-xs text-gray-500">{item.company} | {item.startDate} - {item.endDate}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer - No border, soft background */}
                <div className="p-3 text-right bg-slate-50 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-bold rounded-lg cursor-pointer">
                        Đóng lại
                    </button>
                </div>
            </div>
        </div>
    );
}

interface EducationItem {
    school: string;
    major: string;
    startDate: string;
    endDate: string;
}

interface ExperienceItem {
    company: string;
    position: string;
    startDate: string;
    endDate: string;
}

interface Candidate {
    id: string;
    userId: string;
    jobId: string;
    cvUrl: string | null;
    resumeId: string | null;
    coverLetter: string | null;
    status: "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED" | string;
    isBookmarked: boolean;
    createdAt: string;
    updatedAt: string;
    job: {
        id: string;
        title: string;
    };
    user: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
        phone?: string | null;
    };
    resume?: {
        id: string;
        title: string | null;
        summary: string | null;
        address: string | null;
        education: unknown;
        experience: unknown;
    } | null;
}

function parseResumeJson<T>(jsonValue: unknown): T[] {
    if (!jsonValue) return [];
    if (typeof jsonValue === 'string') {
        try {
            return JSON.parse(jsonValue) as T[];
        } catch {
            return [];
        }
    }
    if (Array.isArray(jsonValue)) return jsonValue as T[];
    return [];
}

function ResumeSummaryBlock({ education, experience }: { education: unknown; experience: unknown }) {
    const edu = parseResumeJson<EducationItem>(education);
    const exp = parseResumeJson<ExperienceItem>(experience);

    if (edu.length === 0 && exp.length === 0) return null;

    return (
        <div className="space-y-2 pt-3 bg-slate-50/50 p-4 rounded-xl">
            {edu.length > 0 && (
                <div className="flex gap-1.5 items-start text-xs text-gray-600">
                    <span className="material-symbols-outlined text-[15px] text-[#0052CC] mt-0.5">school</span>
                    <div className="min-w-0 flex-1">
                        <span className="font-semibold text-gray-700">{edu[0].school}</span>
                        {edu[0].major && <span className="text-gray-550"> - Ngành: {edu[0].major}</span>}
                    </div>
                </div>
            )}
            {exp.length > 0 && (
                <div className="flex gap-1.5 items-start text-xs text-gray-600">
                    <span className="material-symbols-outlined text-[15px] text-[#0052CC] mt-0.5">work</span>
                    <div className="min-w-0 flex-1">
                        <span className="font-semibold text-gray-700">{exp[0].position}</span>
                        {exp[0].company && <span className="text-gray-550"> tại {exp[0].company}</span>}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EmployerCandidatesPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [cvModal, setCvModal] = useState<{ id: string; name: string } | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    const [state, fetchCandidates, isPending] = useActionState(getIsBookmark, null);

    useEffect(() => {
        startTransition(() => {
            fetchCandidates();
        });
    }, [fetchCandidates]);

    useEffect(() => {
        if (state?.success && state.data) {
            setCandidates(state.data as Candidate[]);
        }
        setLoading(isPending);
    }, [state, isPending]);

    const toggleBookmark = async (id: string, currentStatus: boolean) => {
        setUpdatingId(id);
        try {
            const res = await handleBookmark(id);
            if (res.success) {
                setCandidates(prev => prev.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error("Lỗi cập nhật lưu trữ:", error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: "ACCEPTED" | "REJECTED") => {
        setUpdatingId(id);
        try {
            const res = await updateApplicationStatus(id, newStatus);
            if (res.success) {
                setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
            }
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái tuyển dụng:", error);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredCandidates = candidates.filter(candidate => {
        if (filterStatus === "ALL") return true;
        return candidate.status === filterStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACCEPTED":
                return <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Đã tiếp nhận</span>;
            case "REJECTED":
                return <span className="bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">Đã từ chối</span>;
            case "REVIEWING":
                return <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">Đang xem xét</span>;
            default:
                return <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">Chờ xử lý</span>;
        }
    };

    return (
        <div className="w-full mx-auto p-4 md:p-6 bg-slate-50/20 min-h-screen space-y-6">
            {/* TIÊU ĐỀ CHÍNH - themed gradient header with no border */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#0052CC] to-[#0040a2] rounded-3xl p-8 shadow-md text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_120%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                <div className="relative z-10 space-y-1">
                    <h1 className="text-2xl md:text-3xl font-black">Ứng viên tiềm năng</h1>
                    <p className="text-sm text-white/80">Danh sách các hồ sơ ứng viên bạn đã lưu trữ để theo dõi dài hạn.</p>
                </div>
            </div>

            {/* THANH TABS BỘ LỌC - borderless, shadow-sm */}
            <div className="bg-white rounded-2xl shadow-sm p-2 flex flex-wrap gap-1">
                {[
                    { key: "ALL", label: "Tất cả hồ sơ đã lưu" },
                    { key: "PENDING", label: "Chờ xử lý" },
                    { key: "ACCEPTED", label: "Đã tiếp nhận" },
                    { key: "REJECTED", label: "Đã từ chối" },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilterStatus(tab.key)}
                        className={`px-4 py-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${filterStatus === tab.key
                            ? "bg-[#0052CC] text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-50"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* HIỂN THỊ LOADING HOẶC DANH SÁCH */}
            {loading ? (
                <div className="flex flex-col justify-center items-center py-20">
                    <div className="w-10 h-10 border-[3px] border-slate-200 border-t-[#0052CC] rounded-full animate-spin mb-3" />
                    <p className="text-sm text-slate-400 font-bold">Đang tải danh sách hồ sơ...</p>
                </div>
            ) : filteredCandidates.length === 0 ? (
                <div className="bg-white rounded-3xl text-center py-20 shadow-sm">
                    <span className="material-symbols-outlined text-5xl text-slate-350 mb-3 block">bookmark_heart</span>
                    <p className="text-sm text-slate-400 font-semibold">Không tìm thấy hồ sơ ứng viên tiềm năng nào.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredCandidates.map(candidate => {
                        const isExpanded = expandedId === candidate.id;
                        return (
                            <div
                                key={candidate.id}
                                className={`bg-white rounded-3xl shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-[#0052CC]/15 shadow-md' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
                            >
                                {/* HEADER CARD */}
                                <div
                                    onClick={() => toggleExpand(candidate.id)}
                                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                                >
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <img
                                            src={candidate.user.avatar
                                                ? candidate.user.avatar.startsWith('http')
                                                    ? candidate.user.avatar
                                                    : `/${candidate.user.avatar.replace(/^(employer\/)?(public\/)?/, '')}`
                                                : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                            alt={candidate.user.name}
                                            className="w-12 h-12 rounded-full object-cover bg-slate-50 flex-shrink-0"
                                        />
                                        <div className="min-w-0 flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 md:items-center">
                                            <div>
                                                <h3 className="text-sm md:text-base font-extrabold text-slate-800 truncate mb-0.5">
                                                    {candidate.user.name}
                                                </h3>
                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400 font-semibold">
                                                    <span className="flex items-center gap-0.5">
                                                        <span className="material-symbols-outlined text-[13px]">mail</span>
                                                        {candidate.user.email}
                                                    </span>
                                                    {candidate.user.phone && (
                                                        <span className="flex items-center gap-0.5">
                                                            <span className="material-symbols-outlined text-[13px]">call</span>
                                                            {candidate.user.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vị trí ứng tuyển</p>
                                                <p className="text-xs md:text-sm font-black text-slate-700 truncate">{candidate.job.title}</p>
                                            </div>

                                            <div className="flex md:justify-end items-center gap-4">
                                                <div className="text-right hidden md:block">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ngày nộp</p>
                                                    <p className="text-xs font-bold text-slate-600">{new Date(candidate.createdAt).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                                <div>
                                                    {getStatusBadge(candidate.status)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 md:pl-4 border-t md:border-t-0 pt-3 md:pt-0">
                                        <button
                                            disabled={updatingId === candidate.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleBookmark(candidate.id, candidate.isBookmarked);
                                            }}
                                            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
                                            title="Bỏ lưu hồ sơ khỏi mục tiềm năng"
                                        >
                                            <span className="material-symbols-outlined text-[20px] fill-amber-500">
                                                bookmark
                                            </span>
                                        </button>

                                        <div className="p-1.5 text-slate-450 rounded-lg flex items-center justify-center">
                                            <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isExpanded ? 'rotate-180 text-slate-700' : ''}`}>
                                                keyboard_arrow_down
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* DROPDOWN DETAILS SECTION */}
                                {isExpanded && (
                                    <div className="px-5 pb-5 bg-slate-50/50 pt-4 space-y-4 animate-fadeIn">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                            {/* Details - Left */}
                                            <div className="lg:col-span-2 space-y-4">
                                                {candidate.resume ? (
                                                    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
                                                        <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">
                                                            CV hệ thống: <span className="text-[#041b3c] font-black normal-case">{candidate.resume.title || "CV chưa đặt tên"}</span>
                                                        </p>

                                                        {candidate.resume.summary && (
                                                            <p className="text-xs md:text-sm text-slate-650 italic bg-slate-50/50 p-3 rounded-xl">{candidate.resume.summary}</p>
                                                        )}

                                                        <ResumeSummaryBlock
                                                            education={candidate.resume.education}
                                                            experience={candidate.resume.experience}
                                                        />
                                                    </div>
                                                ) : candidate.cvUrl ? (
                                                    <div className="bg-amber-50/40 rounded-2xl p-5 text-center">
                                                        <p className="text-xs md:text-sm text-amber-800 font-bold flex items-center justify-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[18px]">link</span>
                                                            Ứng viên tải lên File CV gốc đính kèm. Sử dụng nút tải xuống bên phải để xem.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-slate-400 italic bg-white p-4 rounded-xl text-center shadow-sm">Hồ sơ này không đính kèm thông tin CV.</p>
                                                )}
                                            </div>

                                            {/* Actions - Right */}
                                            <div className="flex flex-col justify-center space-y-3 bg-white p-5 rounded-2xl shadow-sm self-start w-full">
                                                <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">Thao tác hồ sơ</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <a
                                                        href={candidate.cvUrl || '#'}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className={`py-2 text-slate-700 bg-slate-50 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 hover:bg-slate-100 transition-colors ${!candidate.cvUrl ? 'pointer-events-none opacity-50 bg-slate-100' : ''}`}
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">download</span>
                                                        CV gốc
                                                    </a>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCvModal({ id: candidate.id, name: candidate.user.name });
                                                        }}
                                                        className="py-2 bg-[#0052CC] hover:bg-[#0040a2] text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                        Xem CV đầy đủ
                                                    </button>
                                                </div>

                                                {(candidate.status === "PENDING" || candidate.status === "REVIEWING") && (
                                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 mt-2">
                                                        <button
                                                            disabled={updatingId === candidate.id}
                                                            onClick={() => handleUpdateStatus(candidate.id, "ACCEPTED")}
                                                            className="py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">check</span>
                                                            Tiếp nhận
                                                        </button>
                                                        <button
                                                            disabled={updatingId === candidate.id}
                                                            onClick={() => handleUpdateStatus(candidate.id, "REJECTED")}
                                                            className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                                            Từ chối
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {cvModal && (
                <CvPreviewModal
                    applicationId={cvModal.id}
                    candidateName={cvModal.name}
                    onClose={() => setCvModal(null)}
                />
            )}
        </div>
    );
}