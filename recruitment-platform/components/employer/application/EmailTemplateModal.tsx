'use client';

import { useEffect, useState } from 'react';

interface EmailTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidateName: string;
    jobTitle: string;
    companyName: string;
    status: 'ACCEPTED' | 'REJECTED';
    onSubmit: (subject: string, body: string) => void;
    isSending: boolean;
}

export default function EmailTemplateModal({
    isOpen,
    onClose,
    candidateName,
    jobTitle,
    companyName,
    status,
    onSubmit,
    isSending,
}: EmailTemplateModalProps) {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        if (status === 'ACCEPTED') {
            setSubject(`Thư mời phỏng vấn - Vị trí ${jobTitle} - ${companyName}`);
            setBody(
                `Chào ${candidateName},

Cảm ơn bạn đã quan tâm và gửi hồ sơ ứng tuyển vào vị trí ${jobTitle} tại ${companyName}.

Hồ sơ của bạn đã được ban tuyển dụng đánh giá cao. Chúng tôi trân trọng kính mời bạn tham dự buổi phỏng vấn trao đổi chi tiết hơn về công việc.

Bạn vui lòng phản hồi lại email này để xác nhận sự tham gia hoặc đề xuất khung giờ phù hợp hơn.

Trân trọng,
Ban tuyển dụng ${companyName}`
            );
        } else {
            setSubject(`Thư cảm ơn ứng tuyển vị trí ${jobTitle} - ${companyName}`);
            setBody(
                `Chào ${candidateName},

Cảm ơn bạn đã dành thời gian quan tâm và gửi hồ sơ ứng tuyển vị trí ${jobTitle} tại ${companyName}.

Sau khi xem xét kỹ lưỡng hồ sơ, chúng tôi rất tiếc khi chưa thể đồng hành cùng bạn ở vị trí này vào thời điểm hiện tại do các tiêu chí công việc chưa thực sự phù hợp. Tuy nhiên, chúng tôi sẽ lưu thông tin của bạn vào hệ thống tài năng của công ty để kết nối khi có cơ hội phù hợp hơn trong tương lai.

Chúc bạn luôn nhiều may mắn, sức khỏe và gặt hái được nhiều thành công trên con đường sự nghiệp của mình.

Trân trọng,
Ban tuyển dụng ${companyName}`
            );
        }
    }, [isOpen, status, candidateName, jobTitle, companyName]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-150">
                {/* Header - themed and borderless */}
                <div className="p-5 bg-slate-50 rounded-t-3xl flex justify-between items-center">
                    <h2 className="font-extrabold text-slate-800 flex items-center gap-2 text-base">
                        <span className="material-symbols-outlined text-[#0052CC]">mail</span>
                        Soạn thảo Email Gửi Ứng Viên ({status === 'ACCEPTED' ? 'Mời phỏng vấn' : 'Thư từ chối'})
                    </h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer transition-colors">
                        <span className="material-symbols-outlined block">close</span>
                    </button>
                </div>

                {/* Body Form */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tiêu đề thư (Subject)</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full h-11 px-4 text-sm bg-slate-50 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#0052CC]/20 transition-all font-semibold text-slate-800"
                            placeholder="Nhập tiêu đề email..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nội dung email (Body)</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={12}
                            className="w-full p-4 text-sm bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-[#0052CC]/20 transition-all text-slate-700 leading-relaxed resize-none"
                            placeholder="Nhập nội dung thư..."
                        />
                    </div>
                </div>

                {/* Footer buttons */}
                <div className="p-4 bg-slate-50 rounded-b-3xl flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSending}
                        className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        disabled={isSending}
                        onClick={() => onSubmit(subject, body)}
                        className="px-6 py-2.5 bg-[#0052CC] hover:bg-[#0040a2] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                    >
                        {isSending ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Đang gửi...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[15px]">send</span>
                                Gửi email & Lưu trạng thái
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
