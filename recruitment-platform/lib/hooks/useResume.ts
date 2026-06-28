import { useState } from "react";
import { Resume } from "../types/candidate/Resume";

export function useResume(initialResumes: Resume[]) {
    const [resumes, setResumes] = useState<Resume[]>(initialResumes);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
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

    return {
        resumes,
        setResumes,
        deleting,
        setDeleting,
        handleDelete,
        handleSetDefault,
        loading,
        setLoading
    };
}
