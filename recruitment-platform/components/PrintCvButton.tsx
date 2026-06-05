"use client";
// components/PrintCvButton.tsx
// Dùng ở trang xem CV của candidate
// Ví dụ: <PrintCvButton resumeId={resume.id} />

import { useState } from "react";

export default function PrintCvButton({ resumeId, className }: { resumeId: string; className?: string }) {
    const handlePrint = () => {
        const win = window.open(`/cv/${resumeId}?print=true`, "_blank");
        if (!win) {
            alert("Trình duyệt đã chặn popup. Vui lòng cho phép popup cho trang này.");
        }
    };

    return (
        <button
            onClick={handlePrint}
            className={className || "h-9 px-4 rounded-xl text-[13px] font-semibold text-white bg-[#00b14f] hover:bg-[#009940] transition-colors cursor-pointer flex items-center gap-2 shadow-sm"}
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            In / Lưu PDF
        </button>
    );
}