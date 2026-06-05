'use client';

import { useEffect, useState } from 'react';

export default function CvPreviewModal({
  applicationId,
  candidateName,
  onClose,
}: {
  applicationId: string;
  candidateName: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewDocument, setPreviewDocument] = useState('');
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [resumeTitle, setResumeTitle] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/employer/applications/${applicationId}/cv`)
      .then(async r => {
        const d = await r.json();
        if (!r.ok) {
          setError(d.error || 'Không tải được CV');
          return;
        }
        if (d.previewDocument) {
          setPreviewDocument(d.previewDocument);
          setResumeTitle(d.resumeTitle || '');
        }
        if (d.cvUrl) setCvUrl(d.cvUrl);
      })
      .catch(() => setError('Lỗi kết nối'))
      .finally(() => setLoading(false));
  }, [applicationId]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-[#041b3c]">CV — {candidateName}</h3>
            {resumeTitle && <p className="text-xs text-gray-400 mt-0.5">{resumeTitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-gray-100 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#0052CC] rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Đang tải CV...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <span className="material-symbols-outlined text-5xl text-gray-300 mb-2">description</span>
              <p className="text-sm text-gray-600">{error}</p>
              {cvUrl && (
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 px-5 py-2 bg-[#0052CC] text-white text-sm font-bold rounded-lg"
                >
                  Mở file CV đính kèm
                </a>
              )}
            </div>
          ) : previewDocument ? (
            <iframe
              title="CV Preview"
              srcDoc={previewDocument}
              className="w-full h-full min-h-[500px] border-0 bg-white"
              sandbox="allow-same-origin"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
