'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ResumeTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  category: string;
}

export default function TaoCvPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Load templates
  useEffect(() => {
    fetch('/api/public/templates')
      .then(r => r.json())
      .then(d => { if (d.templates) setTemplates(d.templates); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (t: ResumeTemplate) => {
    router.push(`/tao-cv/${t.slug}`);
  };

  return (
    <div className="min-h-screen bg-[#f7f8f5]">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
          <div className="w-7 h-7 bg-[#00b14f] rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-[15px] font-bold text-gray-900">Tạo CV</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Chọn mẫu CV <span className="text-[#00b14f]">của bạn</span>
          </h1>
          <p className="text-gray-400 text-sm">Chọn mẫu để bắt đầu chỉnh sửa trực tiếp trên CV</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-9 h-9 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 font-medium">Chưa có mẫu CV nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {templates.map(t => (
              <div key={t.id} onClick={() => handleSelect(t)}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer transition-all hover:border-[#00b14f]/50 hover:shadow-lg hover:-translate-y-0.5 flex flex-col">
                <div className="relative h-52 bg-[#f7f8f5] overflow-hidden">
                  {t.thumbnailUrl ? (
                    <img src={t.thumbnailUrl} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[#00b14f]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-[#00963e] text-sm font-bold px-5 py-2.5 rounded-xl">Dùng mẫu này →</span>
                  </div>
                  <span className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider bg-white/95 text-gray-500 px-2 py-1 rounded-lg border border-gray-100">
                    {t.category}
                  </span>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">{t.name}</p>
                  {t.description && <p className="text-[11px] text-gray-400 truncate mt-0.5">{t.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}