'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatDateVi } from '@/lib/jobLabels';

interface Resume {
  id: string;
  title: string;
  address: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
  template: { id: string; name: string; slug: string; thumbnailUrl: string | null } | null;
  _count: { applications: number };
}

export default function CandidateResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    fetch('/api/candidate/resumes')
      .then(r => r.json())
      .then(d => setResumes(d.resumes || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumes.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-br from-[#00b14f]/10 to-[#041b3c]/5 flex items-center justify-center border-b border-gray-50">
                {r.template?.thumbnailUrl ? (
                  <img src={r.template.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-5xl text-[#00b14f]/40">description</span>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-[#041b3c] truncate">{r.title}</h3>
                {r.template && (
                  <p className="text-xs text-[#00b14f] font-medium mt-0.5">Mẫu: {r.template.name}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Cập nhật {formatDateVi(r.updatedAt)} · {r._count.applications} lần ứng tuyển
                </p>
                {r.summary && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{r.summary}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <a
                    href={`/api/resumes/${r.id}/render`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center py-2 text-sm font-semibold text-white bg-[#00b14f] rounded-lg hover:bg-[#009940] transition-colors"
                  >
                    Xem CV
                  </a>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deleting === r.id}
                    className="px-3 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer disabled:opacity-50"
                  >
                    {deleting === r.id ? '...' : 'Xóa'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
