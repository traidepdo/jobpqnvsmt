'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Check, Eye, EyeOff, Search, Trash2, Calendar, Clock,
  AlertCircle, Briefcase, Info, MessageSquare, ChevronRight, ChevronLeft
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  refId: string | null;
}

const TYPE_CONFIG: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  APPLICATION_RECEIVED: { icon: MessageSquare, label: "Đơn ứng tuyển", color: "#2554F0", bg: "#EEF2FF" },
  APPLICATION_STATUS_CHANGED: { icon: MessageSquare, label: "Đơn ứng tuyển", color: "#2554F0", bg: "#EEF2FF" },
  JOB_APPROVED: { icon: Briefcase, label: "Tin tuyển dụng", color: "#15803D", bg: "#DCFCE7" },
  COMPANY_APPROVED: { icon: Info, label: "Tài khoản", color: "#B7791F", bg: "#FEF3E2" },
  NEW_MESSAGE: { icon: MessageSquare, label: "Tin nhắn", color: "#6D28D9", bg: "#EDE9FE" },
  JOB_DEADLINE: { icon: AlertCircle, label: "Hạn tin tuyển dụng", color: "#B91C1C", bg: "#FEE2E2" },
  SYSTEM: { icon: Info, label: "Hệ thống", color: "#4B5563", bg: "#F3F4F6" },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function EmployerNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Notification | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employer/notifications");
      if (res.ok) {
        const d = await res.json();
        setNotifications(d.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/employer/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
        if (selected?.id === id) {
          setSelected(prev => prev ? { ...prev, isRead: true } : null);
        }
        // Emit event to update global header notification bell
        window.dispatchEvent(new Event("notifications:read"));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map(n => 
        fetch(`/api/employer/notifications/${n.id}/read`, { method: "PATCH" })
      ));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      if (selected) {
        setSelected(prev => prev ? { ...prev, isRead: true } : null);
      }
      window.dispatchEvent(new Event("notifications:read"));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelected(notification);
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
  };

  const handleGoToRef = (n: Notification) => {
    if (!n.refId) return;
    if (n.type === "APPLICATION_RECEIVED") {
      router.push(`/employer/applications?jobId=${n.refId}`);
    } else if (n.type === "NEW_MESSAGE") {
      router.push(`/employer/messages?id=${n.refId}`);
    } else if (n.type === "JOB_APPROVED" || n.type === "JOB_DEADLINE") {
      router.push(`/employer/jobs`);
    } else if (n.type === "COMPANY_APPROVED") {
      router.push(`/employer/dashboard`);
    }
  };

  const filteredNotifications = notifications
    .filter(n => {
      if (filter === "UNREAD") return !n.isRead;
      if (filter === "READ") return n.isRead;
      return true;
    })
    .filter(n => {
      if (!search) return true;
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const totalPages = Math.ceil(filteredNotifications.length / pageSize);
  const paginatedNotifications = filteredNotifications.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 w-full mx-auto px-4 py-6 text-slate-800 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0052CC] to-[#0040a2] rounded-3xl p-8 shadow-md text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_120%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-white/95">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Trung tâm thông báo
          </div>
          <h1 className="text-3xl font-black tracking-tight">Thông báo hệ thống</h1>
          <p className="text-sm text-white/80 max-w-xl">
            Cập nhật trạng thái duyệt tin, đơn ứng tuyển mới từ ứng cử viên và các tin tức quan trọng từ ban quản trị hệ thống.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main List */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-100/60 space-y-4">
          {/* List Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-50 pb-4">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-slate-800 text-base">Hộp thư đến</span>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 bg-blue-50 text-[#0052CC] text-xs font-black rounded-full border border-blue-100">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-slate-50 border-slate-200 text-slate-550 hover:bg-slate-100"
              >
                <Check size={14} />
                Đánh dấu đọc tất cả
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit">
              {([
                ["ALL", "Tất cả"],
                ["UNREAD", "Chưa đọc"],
                ["READ", "Đã đọc"]
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filter === k
                      ? "bg-white text-[#0052CC] shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Tìm nội dung thông báo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-xs border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#0052CC]/15 transition-all font-bold"
              />
            </div>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-[#0052CC] rounded-full animate-spin" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-4xl block mb-2 text-slate-200">mail_lock</span>
              <p className="text-xs font-bold">Không có thông báo nào phù hợp bộ lọc</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-50">
                {paginatedNotifications.map(n => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
                  const IconComponent = cfg.icon;

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`py-4 px-3 flex items-start gap-4 cursor-pointer hover:bg-slate-50/80 rounded-2xl transition-colors group relative ${
                        !n.isRead ? "bg-blue-50/20" : ""
                      } ${selected?.id === n.id ? "bg-slate-50 border border-slate-100" : ""}`}
                    >
                      {/* Unread Indicator Dot */}
                      {!n.isRead && (
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#2554F0]" />
                      )}

                      {/* Icon container */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: cfg.bg, color: cfg.color }}
                      >
                        <IconComponent size={18} />
                      </div>

                      {/* Main content snippet */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {cfg.label}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {formatDate(n.createdAt)}
                          </span>
                        </div>
                        <h3 className={`text-xs font-extrabold text-slate-800 truncate ${!n.isRead ? "text-slate-900 font-black" : ""}`}>
                          {n.title}
                        </h3>
                        <p className="text-[11px] text-slate-450 truncate">
                          {n.content}
                        </p>
                      </div>

                      <ChevronRight size={14} className="text-slate-350 self-center group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  );
                })}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-slate-50">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        page === p
                          ? "bg-[#0052CC] text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-650 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-5">
          {selected ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/60 space-y-5 animate-scaleUp sticky top-6">
              {/* Detail Header */}
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: (TYPE_CONFIG[selected.type] || TYPE_CONFIG.SYSTEM).bg,
                      color: (TYPE_CONFIG[selected.type] || TYPE_CONFIG.SYSTEM).color
                    }}
                  >
                    {(() => {
                      const Icon = (TYPE_CONFIG[selected.type] || TYPE_CONFIG.SYSTEM).icon;
                      return <Icon size={16} />;
                    })()}
                  </div>
                  <span className="font-extrabold text-sm text-slate-800">
                    {(TYPE_CONFIG[selected.type] || TYPE_CONFIG.SYSTEM).label}
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Title & Date */}
              <div className="space-y-1">
                <h2 className="font-black text-slate-800 text-sm leading-snug">
                  {selected.title}
                </h2>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                  <Clock size={12} />
                  {formatDate(selected.createdAt)}
                </div>
              </div>

              {/* Content body */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/60 leading-relaxed text-xs text-slate-650 whitespace-pre-wrap">
                {selected.content}
              </div>

              {/* Action Buttons */}
              {selected.refId && (
                <button
                  onClick={() => handleGoToRef(selected)}
                  className="w-full h-11 bg-[#0052CC] hover:bg-[#0040a2] text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Xem chi tiết xử lý
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 sticky top-6">
              <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">drafts</span>
              <p className="text-xs font-bold">Chọn một thông báo ở danh sách bên trái để đọc nội dung chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
