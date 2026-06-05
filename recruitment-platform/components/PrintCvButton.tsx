"use client";
// components/PrintCvButton.tsx
// Dùng ở trang xem CV của candidate
// Ví dụ: <PrintCvButton resumeId={resume.id} />

import { useState } from "react";

export default function PrintCvButton({ resumeId }: { resumeId: string }) {
    const [loading, setLoading] = useState(false);

    const handlePrint = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/resumes/${resumeId}/render`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert(err.error || "Không thể tải CV");
                return;
            }

            const html = await res.text();

            // Mở cửa sổ mới với HTML đã render, sau đó gọi print()
            const win = window.open("", "_blank");
            if (!win) {
                alert("Trình duyệt đã chặn popup. Vui lòng cho phép popup cho trang này.");
                return;
            }

            win.document.write(html);
            win.document.close();

            // Đợi tài nguyên load xong rồi mới print
            win.onload = () => {
                win.focus();
                win.print();
            };

            // Fallback nếu onload không fire (một số browser)
            setTimeout(() => {
                win.focus();
                win.print();
            }, 800);
        } catch {
            alert("Lỗi kết nối");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePrint}
            disabled={loading}
            className="h-9 px-4 rounded-xl text-[13px] font-semibold text-white bg-[#00b14f] hover:bg-[#009940] transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2 shadow-sm"
        >
            {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
            ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
            )}
            In / Lưu PDF
        </button>
    );
}