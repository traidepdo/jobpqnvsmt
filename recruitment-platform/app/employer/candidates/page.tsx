'use client'
import { useEffect, useState } from "react";
// 🌟 Hãy kiểm tra và sửa lại đường dẫn import Modal này cho chuẩn với dự án của bạn nhé:
// 🌟 TỰ DỰNG MODAL XEM NHANH TẠI CHỖ (XÓA DÒNG IMPORT BỊ LỖI ĐI)
function CvPreviewModal({ applicationId, candidateName, onClose }: { applicationId: string; candidateName: string; onClose: () => void }) {
    const [resumeData, setResumeData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch trực tiếp dữ liệu đơn ứng tuyển để lấy thông tin CV đầy đủ
        fetch(`/api/employer/applications`)
            .then(res => res.json())
            .then(data => {
                const apps = data.applications || [];
                const currentApp = apps.find((a: any) => a.id === applicationId);
                if (currentApp?.resume) {
                    setResumeData(currentApp.resume);
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
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#0052CC]">account_circle</span>
                        Chi tiết CV: {candidateName}
                    </h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 cursor-pointer">
                        <span className="material-symbols-outlined block">close</span>
                    </button>
                </div>

                {/* Nội dung CV */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {loading ? (
                        <div className="py-10 text-center text-sm text-gray-400">Đang tải chi tiết CV...</div>
                    ) : !resumeData ? (
                        <div className="py-10 text-center text-sm text-gray-500 italic">Không tìm thấy dữ liệu CV hệ thống của ứng viên này.</div>
                    ) : (
                        <>
                            {/* Tiêu đề & Giới thiệu */}
                            <div>
                                <h3 className="text-lg font-bold text-[#041b3c]">{resumeData.title || "CV chưa đặt tên"}</h3>
                                {resumeData.address && <p className="text-xs text-gray-500 mt-0.5">📍 Địa chỉ: {resumeData.address}</p>}
                                {resumeData.summary && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-xl border-l-4 border-[#00b14f]">
                                        <p className="text-sm text-gray-600 italic">"{resumeData.summary}"</p>
                                    </div>
                                )}
                            </div>

                            {/* Học vấn */}
                            {edu.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-1">
                                        <span className="material-symbols-outlined text-[18px] text-[#00b14f]">school</span> Học vấn
                                    </h4>
                                    {edu.map((item, index) => (
                                        <div key={index} className="text-sm">
                                            <p className="font-semibold text-gray-800">{item.school}</p>
                                            <p className="text-xs text-gray-500">Chuyên ngành: {item.major || "Chưa cập nhật"} | {item.startDate} - {item.endDate}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Kinh nghiệm */}
                            {exp.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-1">
                                        <span className="material-symbols-outlined text-[18px] text-[#00b14f]">work</span> Kinh nghiệm làm việc
                                    </h4>
                                    {exp.map((item, index) => (
                                        <div key={index} className="text-sm">
                                            <p className="font-semibold text-gray-800">{item.position}</p>
                                            <p className="text-xs text-gray-500">{item.company} | {item.startDate} - {item.endDate}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer nút đóng */}
                <div className="p-3 border-t border-gray-100 text-right bg-gray-50 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg cursor-pointer">
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

// Hàm giải mã JSON an toàn từ Database
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

// Cấu phần tóm tắt Học vấn & Kinh nghiệm
function ResumeSummaryBlock({ education, experience }: { education: unknown; experience: unknown }) {
    const edu = parseResumeJson<EducationItem>(education);
    const exp = parseResumeJson<ExperienceItem>(experience);

    if (edu.length === 0 && exp.length === 0) return null;

    return (
        <div className="space-y-2 pt-1 border-t border-dashed border-gray-200">
            {edu.length > 0 && (
                <div className="flex gap-1.5 items-start text-xs text-gray-600">
                    <span className="material-symbols-outlined text-[15px] text-gray-400 mt-0.5">school</span>
                    <div className="min-w-0 flex-1">
                        <span className="font-semibold text-gray-700">{edu[0].school}</span>
                        {edu[0].major && <span className="text-gray-500"> - Ngành: {edu[0].major}</span>}
                    </div>
                </div>
            )}
            {exp.length > 0 && (
                <div className="flex gap-1.5 items-start text-xs text-gray-600">
                    <span className="material-symbols-outlined text-[15px] text-gray-400 mt-0.5">work</span>
                    <div className="min-w-0 flex-1">
                        <span className="font-semibold text-gray-700">{exp[0].position}</span>
                        {exp[0].company && <span className="text-gray-500"> tại {exp[0].company}</span>}
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

    // State quản lý kích hoạt bật/tắt Modal xem CV
    const [cvModal, setCvModal] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const res = await fetch('/api/employer/candidates');
                const data = await res.json();
                setCandidates(Array.isArray(data) ? data : data.candidates || []);
            } catch (err) {
                console.error("Lỗi lấy danh sách ứng viên:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCandidates();
    }, []);

    // Hủy lưu trữ ứng viên nhanh (Gỡ bookmark)
    const toggleBookmark = async (id: string, currentStatus: boolean) => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/employer/applications/${id}/bookmark`, { method: 'PATCH' });
            if (res.ok) {
                // Vì trang này quy định chỉ hiện Bookmark = true nên xóa luôn khỏi State giao diện khi click gỡ
                setCandidates(prev => prev.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error("Lỗi cập nhật lưu trữ:", error);
        } finally {
            setUpdatingId(null);
        }
    };

    // Tiếp nhận hoặc Từ chối ứng viên
    const handleUpdateStatus = async (id: string, newStatus: "ACCEPTED" | "REJECTED") => {
        setUpdatingId(id);
        try {
            const res = await fetch(`/api/employer/applications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
            }
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái tuyển dụng:", error);
        } finally {
            setUpdatingId(null);
        }
    };

    // Bộ lọc Tab trạng thái (ALL, PENDING, ACCEPTED, REJECTED) dựa trên kho lưu trữ
    const filteredCandidates = candidates.filter(candidate => {
        if (filterStatus === "ALL") return true;
        return candidate.status === filterStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACCEPTED":
                return <span className="bg-green-50 text-green-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">Đã tiếp nhận</span>;
            case "REJECTED":
                return <span className="bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-200">Đã từ chối</span>;
            case "REVIEWING":
                return <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200">Đang xem xét</span>;
            default:
                return <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200">Chờ xử lý</span>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 bg-gray-50/50 min-h-screen">
            {/* TIÊU ĐỀ CHÍNH */}
            <div className="mb-6">
                <h1 className="text-xl md:text-2xl font-bold text-[#041b3c]">Hồ sơ ứng viên tiềm năng</h1>
                <p className="text-sm text-gray-500 mt-1">Danh sách các hồ sơ ứng viên bạn đã lưu trữ để theo dõi dài hạn.</p>
            </div>

            {/* THANH TABS BỘ LỌC */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 flex flex-wrap gap-1 mb-6">
                {[
                    { key: "ALL", label: "Tất cả hồ sơ đã lưu" },
                    { key: "PENDING", label: "Chờ xử lý" },
                    { key: "ACCEPTED", label: "Đã tiếp nhận" },
                    { key: "REJECTED", label: "Đã từ chối" },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilterStatus(tab.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${filterStatus === tab.key
                            ? "bg-[#00b14f] text-white shadow-sm"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* HIỂN THỊ LOADING HOẶC GRID DANH SÁCH */}
            {loading ? (
                <div className="flex flex-col justify-center items-center py-20">
                    <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin mb-3" />
                    <p className="text-sm text-gray-400">Đang tải danh sách hồ sơ...</p>
                </div>
            ) : filteredCandidates.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 text-center py-16 text-gray-500 shadow-sm">
                    <span className="material-symbols-outlined text-5xl text-gray-300 mb-2 block">bookmark_heart</span>
                    <p className="text-sm">Không tìm thấy hồ sơ ứng viên lưu trữ nào ở mục này.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCandidates.map(candidate => (
                        <div
                            key={candidate.id}
                            className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 hover:shadow-md hover:border-[#00b14f]/30 transition-all flex flex-col justify-between relative group"
                        >
                            {/* Icon Bookmark màu vàng cố định hiển thị ở góc */}
                            <button
                                disabled={updatingId === candidate.id}
                                onClick={() => toggleBookmark(candidate.id, candidate.isBookmarked)}
                                className="absolute top-4 right-4 text-amber-500 hover:text-gray-400 transition-colors cursor-pointer disabled:opacity-50"
                                title="Bỏ lưu hồ sơ khỏi mục tiềm năng"
                            >
                                <span className="material-symbols-outlined text-[22px] fill-amber-500">
                                    bookmark
                                </span>
                            </button>

                            <div className="space-y-4">
                                {/* THÔNG TIN NHÂN SỰ CƠ BẢN */}
                                <div className="flex gap-4 items-start pr-6">
                                    <img
                                        src={candidate.user.avatar
                                            ? candidate.user.avatar.startsWith('http')
                                                ? candidate.user.avatar // Nếu là link mạng thì giữ nguyên
                                                : `${candidate.user.avatar.replace(/^(employer\/)?(public\/)?/, '')}` // 🌟 Xóa sạch chữ employer/ hoặc public/ nếu có, và bắt đầu bằng dấu /
                                            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                        alt={candidate.user.name}
                                        className="w-12 h-12 rounded-full object-cover bg-gray-100 border border-gray-100 flex-shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <h3 className="text-base font-semibold text-gray-800 truncate mb-0.5 group-hover:text-[#00b14f] transition-colors">
                                            {candidate.user.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-0.5 truncate">
                                            <span className="material-symbols-outlined text-[14px]">mail</span>
                                            {candidate.user.email}
                                        </p>
                                        {candidate.user.phone && (
                                            <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                                                <span className="material-symbols-outlined text-[14px]">call</span>
                                                {candidate.user.phone}
                                            </p>
                                        )}
                                        <div className="mt-1.5">{getStatusBadge(candidate.status)}</div>
                                    </div>
                                </div>

                                {/* BLOCK TÓM TẮT CV ĐỒNG BỘ STYLE */}
                                {candidate.resume ? (
                                    <div className="bg-gray-50 rounded-xl p-3.5 space-y-2.5 border border-gray-100">
                                        <p className="text-xs font-semibold text-gray-500">
                                            CV hệ thống: <span className="text-[#041b3c]">{candidate.resume.title || "CV chưa đặt tên"}</span>
                                        </p>

                                        {candidate.resume.summary && (
                                            <p className="text-xs text-gray-600 line-clamp-2 italic">{candidate.resume.summary}</p>
                                        )}

                                        <ResumeSummaryBlock
                                            education={candidate.resume.education}
                                            experience={candidate.resume.experience}
                                        />
                                    </div>
                                ) : candidate.cvUrl ? (
                                    <div className="bg-amber-50/60 rounded-xl p-3 text-center border border-amber-100/70">
                                        <p className="text-xs text-amber-700 font-medium flex items-center justify-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">link</span>
                                            Ứng viên tải lên File CV gốc đính kèm
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">Hồ sơ này không đính kèm thông tin CV.</p>
                                )}

                                {/* VỊ TRÍ TUYỂN DỤNG GẮN LIỀN */}
                                <div className="space-y-1 pt-1">
                                    <div className="flex gap-2 items-start text-xs text-gray-600">
                                        <span className="text-gray-400 font-medium flex-shrink-0">Ứng tuyển:</span>
                                        <span className="font-semibold text-gray-800 line-clamp-1">{candidate.job.title}</span>
                                    </div>
                                    <div className="flex gap-2 items-center text-xs text-gray-500">
                                        <span className="text-gray-400 font-medium flex-shrink-0">Ngày nộp:</span>
                                        <span>{new Date(candidate.createdAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* KHỐI CÁC NÚT THAO TÁC VÀ ĐIỀU HƯỚNG CHÍNH */}
                            <div className="space-y-2 pt-4 mt-4 border-t border-gray-100">
                                <div className="grid grid-cols-2 gap-2">
                                    <a
                                        href={candidate.cvUrl || '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`w-full py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 hover:bg-gray-50 hover:border-gray-300 transition-colors ${!candidate.cvUrl ? 'pointer-events-none opacity-50 bg-gray-50' : ''}`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">description</span>
                                        Tải CV gốc
                                    </a>

                                    {/* 🌟 Nút "Xem CV đầy đủ" đã tích hợp e.stopPropagation và kích hoạt State Modal */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCvModal({ id: candidate.id, name: candidate.user.name });
                                        }}
                                        className="w-full py-2 bg-[#0052CC] hover:bg-[#0040a2] text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                        Xem CV đầy đủ
                                    </button>
                                </div>

                                {candidate.status === "PENDING" && (
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <button
                                            disabled={updatingId === candidate.id}
                                            onClick={() => handleUpdateStatus(candidate.id, "ACCEPTED")}
                                            className="w-full py-2 bg-[#00b14f] hover:bg-[#009940] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">check</span>
                                            Tiếp nhận
                                        </button>
                                        <button
                                            disabled={updatingId === candidate.id}
                                            onClick={() => handleUpdateStatus(candidate.id, "REJECTED")}
                                            className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                            Từ chối
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* 🌟 ĐOẠN ĐIỀU KHIỂN MODAL XEM CHI TIẾT CV KHI CLICK VÀO NÚT XANH */}
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