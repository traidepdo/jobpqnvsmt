'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CvPreviewModal from '@/components/employer/CvPreviewModal';
import { formatDateVi, getApplicationStatusLabel } from '@/lib/jobLabels';
import { parseResumeJson, type EducationItem, type ExperienceItem } from '@/lib/renderResume';
import Link from 'next/link';
interface Application {
  id: string;
  status: string;
  coverLetter: string | null;
  createdAt: string;
  isBookmarked: boolean;
  user: { id: string; name: string; email: string; phone: string | null; avatar: string | null };
  job: { id: string; title: string; slug: string };
  resume: {
    id: string;
    title: string;
    summary: string | null;
    address: string | null;
    education: unknown;
    experience: unknown;
  } | null;
  cvUrl?: string | null;
  conversationId?: string | null;
  quizScore?: number | null;
  quizDuration?: number | null;
}

export default function EmployerApplicationsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cvModal, setCvModal] = useState<{ id: string; name: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const getStatusActions = (current: string): string[] => {
    const map: Record<string, string[]> = {
      PENDING: ['REVIEWING', 'ACCEPTED', 'REJECTED'],
      REVIEWING: ['ACCEPTED', 'REJECTED'],
      ACCEPTED: ['REJECTED'],    // chỉ có thể từ chối
      REJECTED: ['REVIEWING'],   // chỉ có thể xem xét lại, KHÔNG có ACCEPTED
    };
    return map[current] ?? [];
  };

  const load = () => {
    setLoading(true);
    const q = filter ? `?status=${filter}` : '';
    fetch(`/api/employer/applications${q}`)
      .then(r => r.json())
      .then(d => setApps(d.applications || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  // autoNavigate: sau khi tạo conversation mới thì tự push sang trang messages
  const updateStatus = async (id: string, status: string, autoNavigate = false) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/employer/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const d = await res.json();
        const newConvId: string | null = d.conversationId ?? null;

        setApps(prev =>
          prev.map(a =>
            a.id === id
              ? { ...a, status: d.application.status, conversationId: newConvId ?? a.conversationId }
              : a
          )
        );

        // Nếu yêu cầu auto-navigate và API trả về conversationId → đi thẳng vào chat
        if (autoNavigate && newConvId) {
          router.push(`/employer/messages?id=${newConvId}`);
        }
      }
    } finally {
      setUpdatingId(null);
    }
  };
  const statusStyle: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    REVIEWING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ACCEPTED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  };

  const handleBookmark = async (id: string) => {
    setUpdatingId(id);
    try {
      // Gọi API cập nhật theo đúng tuyến đường dẫn (Route)
      const res = await fetch(`/api/employer/applications/${id}/bookmark`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Không cần truyền body phức tạp vì API sẽ tự động đọc DB và đảo ngược trạng thái cũ
      });

      if (res.ok) {
        const data = await res.json();

        // Cập nhật lại State danh sách ứng viên dựa trên giá trị thực tế API trả về
        setApps(prev =>
          prev.map(app =>
            app.id === id
              ? {
                ...app,
                // Cập nhật đúng trường dữ liệu Boolean
                isBookmarked: data.isBookmarked
              }
              : app
          )
        );
      } else {
        const errorData = await res.json();
        console.error("Lỗi từ server:", errorData.error);
        alert(errorData.error || "Không thể cập nhật trạng thái ứng viên tiềm năng.");
      }
    } catch (error) {
      console.error("Lỗi kết nối mạng:", error);
    } finally {
      setUpdatingId(null);
    }
  };
  const actionBtnStyle: Record<string, string> = {
    REVIEWING: 'border-indigo-200 text-indigo-700 hover:bg-indigo-50',
    ACCEPTED: 'bg-green-500 hover:bg-green-600 text-white border-green-500',
    REJECTED: 'border-red-200 text-red-600 hover:bg-red-50',
    PENDING: 'border-amber-200 text-amber-700 hover:bg-amber-50',
  };

  const actionLabel: Record<string, string> = {
    REVIEWING: 'Xem xét lại',
    ACCEPTED: 'Chấp nhận',
    REJECTED: 'Từ chối',
    PENDING: 'Chuyển về chờ',
  };
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap gap-2">
        {['', 'PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED'].map(s => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer ${filter === s ? 'bg-[#0052CC] text-white' : 'bg-white border border-gray-200'
              }`}
          >
            {s ? getApplicationStatusLabel(s) : 'Tất cả'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#0052CC] rounded-full animate-spin" />
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed p-12 text-center text-gray-500 text-sm">
          Chưa có đơn ứng tuyển nào
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map(app => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div
                className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer"
                onClick={() => setExpanded(expanded === app.id ? null : app.id)}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {app.user.avatar ? <img src={app.user.avatar} alt="" className='w-12 h-12 rounded-full object-cover' /> : app.user.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#041b3c]">{app.isBookmarked ? <span className="material-symbols-outlined text-amber-500 mr-2">star</span> : ""}{app.user.name}</p>
                  <p className="text-sm text-[#0052CC]">{app.job.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {app.user.email}
                    {app.user.phone && ` · ${app.user.phone}`}
                    {' · '}{formatDateVi(app.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {app.quizScore !== undefined && app.quizScore !== null && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">assignment</span>
                      Test: {app.quizScore}%
                    </span>
                  )}
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusStyle[app.status]}`}>
                    {getApplicationStatusLabel(app.status)}
                  </span>
                  {app.status === 'ACCEPTED' && (
                    <button
                      onClick={() => router.push(`/employer/interviews/${app.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#0052CC] hover:bg-[#0040a2] text-white text-xs font-bold rounded-xl transition-all flex-shrink-0 group-hover:scale-105"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      Đặt lịch
                    </button>
                  )}
                  {app.conversationId && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">chat</span>
                      Đang chat
                    </span>
                  )}
                </div>
              </div>

              {expanded === app.id && (
                <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
                  {app.quizScore !== undefined && app.quizScore !== null && (
                    <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                          <span className="material-symbols-outlined text-[20px]">assignment</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Kết quả bài trắc nghiệm năng lực</p>
                          <p className="text-sm font-bold text-blue-800 mt-0.5">
                            Điểm số: {app.quizScore}%
                          </p>
                        </div>
                      </div>
                      {app.quizDuration !== undefined && app.quizDuration !== null && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500 font-medium">Thời gian làm bài</p>
                          <p className="text-xs font-bold text-gray-700 mt-0.5">
                            {Math.floor(app.quizDuration / 60) > 0 ? `${Math.floor(app.quizDuration / 60)} phút ` : ''}
                            {app.quizDuration % 60} giây
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {app.coverLetter && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Thư giới thiệu</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{app.coverLetter}</p>
                    </div>
                  )}
                  {app.resume ? (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-500">
                          CV trên hệ thống: <span className="text-[#041b3c]">{app.resume.title}</span>
                        </p>

                        <div className='flex flex-wrap items-center gap-2'>
                          {app.isBookmarked ? (
                            /* TRẠNG THÁI 1: ĐÃ LƯU TIỀM NĂNG -> HIỂN THỊ NÚT "BỎ QUAN TÂM" */
                            <button
                              type="button"
                              disabled={updatingId === app.id}
                              onClick={() => handleBookmark(app.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200/80 border border-amber-300 rounded-full transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-60"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className={`w-3.5 h-3.5 text-amber-500 ${updatingId === app.id ? "animate-spin" : ""}`}
                              >
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                              </svg>
                              {updatingId === app.id ? "Đang xử lý..." : "Bỏ quan tâm"}
                            </button>
                          ) : (
                            /* TRẠNG THÁI 2: CHƯA LƯU -> HIỂN THỊ NÚT "TIỀM NĂNG" */
                            <button
                              type="button"
                              disabled={updatingId === app.id}
                              onClick={() => handleBookmark(app.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-amber-700 bg-transparent hover:bg-amber-50/60 border border-gray-200 hover:border-amber-300 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-60"
                            >
                              {/* Icon ngôi sao RỖNG tinh tế (fill="none") */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className={`w-3.5 h-3.5 text-gray-400 group-hover:text-amber-500 ${updatingId === app.id ? "animate-spin" : ""}`}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.151-.326.621-.326.772 0l2.035 4.396 4.817.478c.363.036.508.48.232.729l-3.647 3.326.98 4.755c.074.359-.313.642-.63.464L12 15.754l-4.217 2.203c-.317.178-.704-.105-.63-.464l.98-4.755-3.647-3.326c-.276-.249-.131-.693.232-.729l4.817-.478 2.035-4.396Z" />
                              </svg>
                              {updatingId === app.id ? "Đang xử lý..." : "Tiềm năng"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setCvModal({ id: app.id, name: app.user.name }); }}
                            className="inline-flex items-center gap-1 px-4 py-2 bg-[#0052CC] hover:bg-[#0040a2] text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            Xem CV đầy đủ
                          </button>
                        </div>
                      </div>
                      {app.resume.summary && (
                        <p className="text-sm text-gray-600 line-clamp-3">{app.resume.summary}</p>
                      )}
                      <ResumeSummaryBlock education={app.resume.education} experience={app.resume.experience} />
                    </div>
                  ) : app.cvUrl ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800 mb-2">Ứng viên đính kèm file CV</p>
                      <a href={app.cvUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#0052CC] hover:underline">
                        Tải / mở file CV
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Ứng viên chưa gắn CV</p>
                  )}

                  <ApplicationStatusActions
                    appId={app.id}
                    status={app.status}
                    conversationId={app.conversationId}
                    updating={updatingId === app.id}
                    actions={getStatusActions(app.status)}
                    onUpdate={st => updateStatus(app.id, st)}
                    onGoToChat={convId => router.push(`/employer/messages?id=${convId}`)}
                    // Khi chưa có conversation: ACCEPTED + autoNavigate = true
                    onOpenChat={() => updateStatus(app.id, 'ACCEPTED', true)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )
      }

      {
        cvModal && (
          <CvPreviewModal
            applicationId={cvModal.id}
            candidateName={cvModal.name}
            onClose={() => setCvModal(null)}
          />
        )
      }
    </div >
  );
}

// ── ApplicationStatusActions ──────────────────────────────────
function ApplicationStatusActions({
  appId,
  status,
  conversationId,
  updating,
  actions,
  onUpdate,
  onGoToChat,
  onOpenChat,
}: {
  appId: string;
  status: string;
  conversationId?: string | null;
  updating: boolean;
  actions: string[];
  onUpdate: (status: string) => void;
  onGoToChat: (convId: string) => void;
  onOpenChat: () => void;
}) {
  const statusStyle: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    REVIEWING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ACCEPTED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  };

  const actionBtnStyle: Record<string, string> = {
    REVIEWING: 'border-indigo-200 text-indigo-700 hover:bg-indigo-50',
    ACCEPTED: 'border-green-200 text-green-700 hover:bg-green-50',
    REJECTED: 'border-red-200 text-red-700 hover:bg-red-50',
    PENDING: 'border-amber-200 text-amber-700 hover:bg-amber-50',
  };
  const actionLabel: Record<string, string> = {
    REVIEWING: 'Xem xét lại',
    ACCEPTED: 'Chấp nhận',
    REJECTED: 'Từ chối',
    PENDING: 'Chuyển về chờ',
  };

  const isFinal = status === 'ACCEPTED' || status === 'REJECTED';

  return (
    <div className="pt-2 border-t border-gray-100 space-y-3">
      {/* Status badge */}
      <div className={`rounded-lg px-4 py-3 flex items-center gap-2 ${statusStyle[status] ?? ''} border`}>
        <span className="material-symbols-outlined text-[18px]">
          {status === 'ACCEPTED' ? 'check_circle' : status === 'REJECTED' ? 'cancel' : 'info'}
        </span>
        <p className="text-sm font-semibold">
          Trạng thái hiện tại: {getApplicationStatusLabel(status)}
          {isFinal && ' — đơn đã xử lý xong'}
        </p>
      </div>

      {/* Nút nhắn tin — hiện khi đã ACCEPTED */}
      {status === 'ACCEPTED' && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <span className="material-symbols-outlined text-[20px] text-[#0052CC]">chat</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0052CC]">Ứng viên đã được chấp nhận</p>
            <p className="text-xs text-blue-400">
              {conversationId
                ? 'Cuộc trò chuyện đã mở — nhấn để tiếp tục'
                : 'Nhấn để mở kênh chat với ứng viên'}
            </p>
          </div>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              if (conversationId) {
                // Đã có conversation → navigate thẳng
                onGoToChat(conversationId);
              } else {
                // Chưa có → gọi API tạo conversation rồi navigate
                onOpenChat();
              }
            }}
            disabled={updating}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0052CC] hover:bg-[#0040a2] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">
              {conversationId ? 'open_in_new' : 'chat_bubble'}
            </span>
            {updating ? 'Đang mở...' : conversationId ? 'Vào chat' : 'Mở chat'}
          </button>
        </div>
      )}

      {/* Action buttons */}
      {actions.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">
            {isFinal ? 'Đổi sang trạng thái khác (nếu cần):' : 'Cập nhật trạng thái:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {actions.map(st => (
              <button
                key={st}
                type="button"
                disabled={updating}
                onClick={e => { e.stopPropagation(); onUpdate(st); }}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border rounded-lg cursor-pointer disabled:opacity-50 transition-colors ${actionBtnStyle[st] ?? 'border-gray-200 hover:bg-gray-50'}`}
              >
                {updating ? (
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">
                      {st === 'ACCEPTED' ? 'check_circle' : st === 'REJECTED' ? 'cancel' : 'replay'}
                    </span>
                    {actionLabel[st] ?? st}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ResumeSummaryBlock ────────────────────────────────────────
function ResumeSummaryBlock({ education, experience }: { education: unknown; experience: unknown }) {
  const edu = parseResumeJson<EducationItem>(education);
  const exp = parseResumeJson<ExperienceItem>(experience);
  if (edu.length === 0 && exp.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600">
      {edu.length > 0 && (
        <div>
          <p className="font-semibold text-gray-500 mb-1">Học vấn</p>
          {edu.slice(0, 2).map((e, i) => (
            <p key={i}>{e.school}{e.degree && ` · ${e.degree}`}</p>
          ))}
        </div>
      )}
      {exp.length > 0 && (
        <div>
          <p className="font-semibold text-gray-500 mb-1">Kinh nghiệm</p>
          {exp.slice(0, 2).map((e, i) => (
            <p key={i}>{e.company}{e.position && ` · ${e.position}`}</p>
          ))}
        </div>
      )}
    </div>
  );
}