import { useEffect, useState } from "react";
import { Interview } from "../types/candidate/interviews";


export function useInterviews(interviewsData: Interview[]) {


    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [respondingId, setRespondingId] = useState<string | null>(null);
    const [declineModal, setDeclineModal] = useState<string | null>(null); // interview id
    const formatDateTime = (dateStr: string) =>
        new Date(dateStr).toLocaleString('vi-VN', {
            weekday: 'long', day: '2-digit', month: '2-digit',
            year: 'numeric', hour: '2-digit', minute: '2-digit',
        });

    const formatCountdown = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - Date.now();
        if (diff < 0) return null;
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        if (days > 0) return `còn ${days} ngày ${hours} giờ`;
        if (hours > 0) return `còn ${hours} giờ ${mins} phút`;
        return `còn ${mins} phút`;
    };


    const respond = async (id: string, candidateStatus: 'CONFIRMED' | 'DECLINED', declineReason?: string) => {
        setRespondingId(id);
        const res = await fetch(`/api/candidate/interviews/${id}/respond`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidateStatus, declineReason }),
        });
        if (res.ok) {
            setInterviews(prev => prev.map(iv =>
                iv.id === id ? { ...iv, candidateStatus, declineReason: declineReason ?? null } : iv
            ));
        }
        setRespondingId(null);
        setDeclineModal(null);
    };
    return {
        formatDateTime,
        formatCountdown,
        interviews,
        loading,
        respondingId,
        declineModal,
        setDeclineModal,
        setRespondingId,
        setInterviews,
        setLoading,
        respond
    };

}