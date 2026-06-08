'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDateVi } from '@/lib/jobLabels';

interface Conversation {
    id: string;
    updatedAt: string;
    unreadCount: number;
    employer: { id: string; name: string; avatar: string | null };
    application: {
        id: string;
        job: { id: string; title: string; slug: string };
    } | null;
    messages: { content: string; createdAt: string; senderId: string }[];
}

interface GroupConversation {
    id: string;
    name: string;
    employerId: string;
    createdAt: string;
    updatedAt: string;
    members: { user: { id: string; name: string; avatar: string | null } }[];
    messages: { content: string; createdAt: string; senderId: string }[];
}

interface Message {
    id: string;
    content: string;
    createdAt: string;
    readAt: string | null;
    sender: { id: string; name: string; avatar: string | null };
}

function Avatar({ name, avatar, size = 9 }: { name: string; avatar?: string | null; size?: number }) {
    const sizeInPx = size * 4;
    const resolvedAvatar = avatar && avatar.trim() !== "" ? avatar : null;
    if (resolvedAvatar) {
        return (
            <img
                src={resolvedAvatar}
                alt={name}
                style={{ width: `${sizeInPx}px`, height: `${sizeInPx}px` }}
                className="rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const parent = (e.target as HTMLElement).parentElement;
                    if (parent && !parent.querySelector('.avatar-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = "avatar-fallback rounded-full bg-[#0052CC] flex items-center justify-center text-white font-bold flex-shrink-0";
                        fallback.style.width = `${sizeInPx}px`;
                        fallback.style.height = `${sizeInPx}px`;
                        fallback.style.fontSize = `${sizeInPx * 0.4}px`;
                        fallback.innerText = name?.[0]?.toUpperCase() || '?';
                        parent.appendChild(fallback);
                    }
                }}
            />
        );
    }
    return (
        <div
            className="avatar-fallback rounded-full bg-[#0052CC] flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ width: `${sizeInPx}px`, height: `${sizeInPx}px`, fontSize: `${sizeInPx * 0.4}px` }}
        >
            {name?.[0]?.toUpperCase() || '?'}
        </div>
    );
}

function GroupAvatar({ name, size = 9 }: { name: string; size?: number }) {
    const sizeInPx = size * 4;
    return (
        <div
            className="rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ width: `${sizeInPx}px`, height: `${sizeInPx}px` }}
        >
            <span className="material-symbols-outlined text-[20px]">groups</span>
        </div>
    );
}

export default function CandidateMessagesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeId = searchParams.get('id');
    const activeType = searchParams.get('type') || 'direct';

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [groupConvs, setGroupConvs] = useState<GroupConversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // UI state
    const [activeTab, setActiveTab] = useState<'direct' | 'group'>('direct');

    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const activeConv = conversations.find(c => c.id === activeId);
    const activeGroup = groupConvs.find(g => g.id === activeId);

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

    // Lấy userId hiện tại
    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.json())
            .then(d => { if (d?.user?.id) setCurrentUserId(d.user.id); });
    }, []);

    const loadConversations = async () => {
        try {
            const res = await fetch('/api/candidate/conversations');
            if (res.ok) {
                const d = await res.json();
                setConversations(d.conversations || []);
            }
        } finally {
            setLoadingConvs(false);
        }
    };

    const loadGroupConversations = async () => {
        const res = await fetch('/api/candidate/group-conversations');
        if (res.ok) {
            const d = await res.json();
            setGroupConvs(d.groups ?? []);
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa tin nhắn này không?")) return;
        try {
            const endpoint = activeType === "group"
                ? `/api/candidate/group-conversations/${activeId}/messages/${msgId}`
                : `/api/candidate/conversations/${activeId}/messages/${msgId}`;
            const res = await fetch(endpoint, { method: "DELETE" });
            if (res.ok) {
                setMessages(prev => prev.filter(m => m.id !== msgId));
            } else {
                const err = await res.json();
                alert(err.error || "Không thể xóa tin nhắn");
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi khi xóa tin nhắn");
        }
    };

    const handleDeleteConversation = async () => {
        if (!activeId) return;
        if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ cuộc hội thoại này không? Hành động này không thể hoàn tác.")) return;
        try {
            const endpoint = activeType === "group"
                ? `/api/candidate/group-conversations/${activeId}`
                : `/api/candidate/conversations/${activeId}`;
            const res = await fetch(endpoint, { method: "DELETE" });
            if (res.ok) {
                router.push("/candidate/messages", { scroll: false });
                setMessages([]);
                if (activeType === "group") {
                    await loadGroupConversations();
                } else {
                    await loadConversations();
                }
            } else {
                const err = await res.json();
                alert(err.error || "Không thể xóa cuộc hội thoại");
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi khi xóa cuộc hội thoại");
        }
    };

    const loadMessages = async (convId: string, type: string) => {
        setLoadingMsgs(true);
        try {
            const endpoint = type === 'group'
                ? `/api/candidate/group-conversations/${convId}/messages`
                : `/api/candidate/conversations/${convId}/messages`;
            const res = await fetch(endpoint);
            if (res.ok) {
                const d = await res.json();
                setMessages(d.messages || []);
            }
        } finally {
            setLoadingMsgs(false);
        }
    };

    const markRead = async (convId: string) => {
        await fetch(`/api/candidate/conversations/${convId}/read`, { method: 'PATCH' });
        setConversations(prev =>
            prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c)
        );
        window.dispatchEvent(new Event('messages:read'));
    };

    useEffect(() => {
        loadConversations();
        loadGroupConversations();
        const interval = setInterval(() => {
            loadConversations();
            loadGroupConversations();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!activeId) return;
        if (pollRef.current) clearInterval(pollRef.current);

        loadMessages(activeId, activeType);
        if (activeType === 'direct') {
            markRead(activeId);
        }

        pollRef.current = setInterval(async () => {
            await loadMessages(activeId, activeType);
            if (activeType === 'direct') {
                await markRead(activeId);
            }
        }, 3000);

        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [activeId, activeType]);

    const prevActiveIdRef = useRef<string | null>(null);

    useEffect(() => {
        const mainEl = document.querySelector('main');
        if (mainEl) {
            const originalOverflow = mainEl.style.overflow;
            mainEl.style.overflow = 'hidden';
            return () => {
                mainEl.style.overflow = originalOverflow;
            };
        }
    }, []);

    useEffect(() => {
        if (!activeId) return;
        const isSameConv = prevActiveIdRef.current === activeId;
        prevActiveIdRef.current = activeId;

        const container = containerRef.current;
        if (container) {
            if (isSameConv) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            } else {
                container.scrollTop = container.scrollHeight;
            }
        }
    }, [messages, activeId]);

    useEffect(() => {
        if (activeId) {
            textareaRef.current?.focus();
        }
    }, [activeId]);

    const selectConv = (id: string, type: 'direct' | 'group') => {
        router.push(`/candidate/messages?id=${id}&type=${type}`, { scroll: false });
    };

    const sendMessage = async () => {
        if (!input.trim() || !activeId || sending) return;
        setSending(true);
        const content = input.trim();
        setInput('');
        try {
            const endpoint = activeType === 'group'
                ? `/api/candidate/group-conversations/${activeId}/messages`
                : `/api/candidate/conversations/${activeId}/messages`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            if (res.ok) {
                const d = await res.json();
                setMessages(prev => [...prev, d.message]);
                if (activeType === 'group') {
                    loadGroupConversations();
                } else {
                    loadConversations();
                }
            }
        } finally {
            setSending(false);
            textareaRef.current?.focus();
        }
    };

    return (
        <div className="flex h-[calc(100vh-56px-40px)] bg-[#f5f7fa] rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
            {/* ── Sidebar ── */}
            <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
                <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-2">
                    <h2 className="font-bold text-[#041b3c] text-lg flex items-center gap-2">
                        Tin nhắn
                        {totalUnread > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {totalUnread > 99 ? '99+' : totalUnread}
                            </span>
                        )}
                    </h2>

                    {/* Tabs */}
                    <div className="flex border border-gray-100 rounded-lg p-0.5 bg-gray-50/60 mt-1">
                        <button
                            onClick={() => setActiveTab('direct')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${activeTab === 'direct' ? 'bg-white text-[#0052CC] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Cá nhân
                        </button>
                        <button
                            onClick={() => setActiveTab('group')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${activeTab === 'group' ? 'bg-white text-[#0052CC] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Nhóm
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingConvs ? (
                        <div className="flex justify-center py-12">
                            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#0052CC] rounded-full animate-spin" />
                        </div>
                    ) : activeTab === 'direct' ? (
                        conversations.length === 0 ? (
                            <div className="px-5 py-12 text-center">
                                <span className="material-symbols-outlined text-[40px] text-gray-300">chat_bubble</span>
                                <p className="text-sm text-gray-400 mt-2">Chưa có cuộc trò chuyện nào</p>
                                <p className="text-xs text-gray-300 mt-1">Khi được chấp nhận ứng tuyển, nhà tuyển dụng sẽ mở chat với bạn</p>
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const lastMsg = conv.messages[0];
                                const isActive = conv.id === activeId && activeType === 'direct';
                                const hasUnread = conv.unreadCount > 0;
                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => selectConv(conv.id, 'direct')}
                                        className={`w-full text-left px-4 py-3.5 flex gap-3 items-start transition-colors border-b border-gray-55 cursor-pointer ${isActive ? 'bg-blue-50 border-l-2 border-l-[#0052CC]'
                                            : hasUnread ? 'bg-blue-50/40 hover:bg-blue-50/60'
                                                : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <Avatar name={conv.employer?.name} avatar={conv.employer?.avatar} size={10} />
                                            {hasUnread && (
                                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                                                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm truncate ${hasUnread ? 'font-bold text-[#041b3c]' : 'font-semibold text-[#041b3c]'}`}>
                                                {conv.employer?.name ?? 'Nhà tuyển dụng'}
                                            </p>
                                            {conv.application?.job?.title && (
                                                <p className="text-[11px] text-[#0052CC] truncate">{conv.application.job.title}</p>
                                            )}
                                            {lastMsg && (
                                                <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-[#041b3c] font-medium' : 'text-gray-400'}`}>
                                                    {lastMsg.senderId === currentUserId ? 'Bạn: ' : ''}{lastMsg.content}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-300 flex-shrink-0 mt-0.5">
                                            {lastMsg ? formatDateVi(lastMsg.createdAt) : formatDateVi(conv.updatedAt)}
                                        </span>
                                    </button>
                                );
                            })
                        )
                    ) : (
                        groupConvs.length === 0 ? (
                            <div className="px-5 py-12 text-center">
                                <span className="material-symbols-outlined text-[40px] text-gray-300">groups</span>
                                <p className="text-sm text-gray-400 mt-2">Chưa có nhóm trò chuyện nào</p>
                                <p className="text-xs text-gray-300 mt-1">Nhà tuyển dụng sẽ thêm bạn vào nhóm khi cần</p>
                            </div>
                        ) : (
                            groupConvs.map(g => {
                                const lastMsg = g.messages?.[0];
                                const isActive = g.id === activeId && activeType === 'group';
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => selectConv(g.id, 'group')}
                                        className={`w-full text-left px-4 py-3.5 flex gap-3 items-start transition-colors border-b border-gray-55 cursor-pointer ${isActive ? 'bg-blue-50 border-l-2 border-l-[#0052CC]' : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <GroupAvatar name={g.name} size={10} />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm truncate font-semibold text-[#041b3c] ${isActive ? 'text-[#0052CC] font-bold' : ''}`}>
                                                {g.name}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate mt-0.5">
                                                {g.members.length} thành viên
                                            </p>
                                            {lastMsg && (
                                                <p className="text-xs truncate mt-0.5 text-gray-400">
                                                    {lastMsg.content}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-300 flex-shrink-0 mt-0.5">
                                            {formatDateVi(g.updatedAt)}
                                        </span>
                                    </button>
                                );
                            })
                        )
                    )}
                </div>
            </aside>

            {/* ── Khu vực chat ── */}
            {activeId && (activeConv || activeGroup) ? (
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            {activeType === 'group' && activeGroup ? (
                                <>
                                    <GroupAvatar name={activeGroup.name} size={9} />
                                    <div className="min-w-0">
                                        <p className="font-bold text-[#041b3c] text-sm truncate">{activeGroup.name}</p>
                                        <p className="text-xs text-gray-400 truncate">
                                            {activeGroup.members.map(m => m.user.name).join(", ")}
                                        </p>
                                    </div>
                                </>
                            ) : activeConv ? (
                                <>
                                    <Avatar name={activeConv.employer?.name} avatar={activeConv.employer?.avatar} size={9} />
                                    <div className="min-w-0">
                                        <p className="font-bold text-[#041b3c] text-sm truncate">
                                            {activeConv.employer?.name ?? 'Nhà tuyển dụng'}
                                        </p>
                                        {activeConv.application?.job && (
                                            <Link
                                                href={`/jobs/${activeConv.application.job.slug}`}
                                                className="text-xs text-[#0052CC] hover:underline truncate block"
                                                target="_blank"
                                            >
                                                {activeConv.application.job.title}
                                            </Link>
                                        )}
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {activeType !== 'group' && (
                            <button
                                onClick={handleDeleteConversation}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                                title="Xóa cuộc hội thoại"
                            >
                                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                                Xóa hội thoại
                            </button>
                        )}
                    </div>

                    {/* Messages */}
                    <div ref={containerRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-[#f8faff]">
                        {loadingMsgs && messages.length === 0 ? (
                            <div className="flex justify-center py-12">
                                <div className="w-7 h-7 border-2 border-gray-200 border-t-[#0052CC] rounded-full animate-spin" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <span className="material-symbols-outlined text-[48px] text-gray-200">chat</span>
                                <p className="text-sm text-gray-400 mt-2">Chưa có tin nhắn nào</p>
                                <p className="text-xs text-gray-300">Hãy bắt đầu cuộc trò chuyện!</p>
                            </div>
                        ) : (
                            messages.map((msg, i) => {
                                const isMine = msg.sender.id === currentUserId;
                                const showDate =
                                    i === 0 ||
                                    new Date(messages[i - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                                return (
                                    <div key={msg.id}>
                                        {showDate && (
                                            <div className="text-center my-3">
                                                <span className="text-[11px] text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
                                                    {formatDateVi(msg.createdAt)}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`flex gap-2 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {!isMine && <Avatar name={msg.sender.name} avatar={msg.sender.avatar} size={7} />}
                                            <div className={`max-w-[70%] flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                                                {!isMine && activeType === 'group' && (
                                                    <p className="text-[10px] text-gray-400 mb-0.5 ml-1">{msg.sender.name}</p>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    {isMine && (
                                                        <button
                                                            onClick={() => handleDeleteMessage(msg.id)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-red-500 cursor-pointer flex-shrink-0"
                                                            title="Xóa tin nhắn"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                                        </button>
                                                    )}
                                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine
                                                        ? 'bg-[#0052CC] text-white rounded-tr-sm'
                                                        : 'bg-white text-[#041b3c] border border-gray-100 rounded-tl-sm shadow-sm'
                                                        }`}>
                                                        {msg.content}
                                                    </div>
                                                </div>
                                                <div className={`flex items-center gap-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-[10px] text-gray-300">
                                                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isMine && (
                                                        <span className={`material-symbols-outlined text-[12px] ${msg.readAt ? 'text-[#0052CC]' : 'text-gray-300'}`}>
                                                            done_all
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="bg-white border-t border-gray-100 px-4 py-3 flex gap-3 items-end flex-shrink-0">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                            }}
                            placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
                            rows={1}
                            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] transition-all max-h-32 leading-relaxed"
                            style={{ minHeight: '42px' }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || sending}
                            className="w-10 h-10 bg-[#0052CC] hover:bg-[#0040a2] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                        >
                            {sending ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined text-[18px]">send</span>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
                    <span className="material-symbols-outlined text-[64px] text-gray-200">forum</span>
                    <p className="mt-3 font-medium text-gray-400">Chọn cuộc trò chuyện</p>
                    <p className="text-sm text-gray-300 mt-1">để bắt đầu nhắn tin với nhà tuyển dụng</p>
                </div>
            )}
        </div>
    );
}