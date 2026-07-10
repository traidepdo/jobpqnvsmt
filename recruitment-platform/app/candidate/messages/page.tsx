'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDateVi } from '@/lib/jobLabels';

interface Conversation {
    id: string;
    updatedAt: string;
    unreadCount: number;
    employer: {
        id: string;
        name: string;
        avatar: string | null;
        company?: {
            id: string;
            name: string;
            logo: string | null;
        } | null;
    };
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
                className="rounded-full object-cover flex-shrink-0 border border-gray-100"
                onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const parent = (e.target as HTMLElement).parentElement;
                    if (parent && !parent.querySelector('.avatar-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = "avatar-fallback rounded-full bg-[#00b14f] flex items-center justify-center text-white font-bold flex-shrink-0";
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
            className="avatar-fallback rounded-full bg-[#00b14f] flex items-center justify-center text-white font-bold flex-shrink-0"
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

function CandidateMessagesPageContent() {
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
    const [searchQuery, setSearchQuery] = useState('');

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

    // Filter conversations based on query
    const filteredConversations = useMemo(() => {
        return conversations.filter(c =>
            c.employer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.application?.job?.title?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [conversations, searchQuery]);

    const filteredGroupConvs = useMemo(() => {
        return groupConvs.filter(g =>
            g.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [groupConvs, searchQuery]);

    return (
        <div className="flex h-[calc(100vh-56px-40px)] bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-md">
            {/* ── Sidebar ── */}
            <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
                <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-3">
                    <h2 className="font-bold text-[#041b3c] text-lg flex items-center gap-2">
                        Tin nhắn
                        {totalUnread > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {totalUnread > 99 ? '99+' : totalUnread}
                            </span>
                        )}
                    </h2>

                    {/* Search bar */}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                            search
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Tìm cuộc trò chuyện..."
                            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:bg-white focus:border-[#00b14f] focus:ring-2 focus:ring-green-100 transition-all placeholder-gray-400"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex border border-gray-100 rounded-xl p-0.5 bg-gray-50/60">
                        <button
                            onClick={() => { setActiveTab('direct'); }}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === 'direct'
                                    ? 'bg-white text-[#00b14f] shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Cá nhân
                        </button>
                        <button
                            onClick={() => { setActiveTab('group'); }}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${activeTab === 'group'
                                    ? 'bg-white text-[#00b14f] shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Nhóm
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-50/50 bg-gray-50/20">
                    {loadingConvs ? (
                        <div className="flex justify-center py-12">
                            <div className="w-7 h-7 border-2 border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
                        </div>
                    ) : activeTab === 'direct' ? (
                        filteredConversations.length === 0 ? (
                            <div className="px-6 py-16 text-center">
                                <span className="material-symbols-outlined text-[42px] text-gray-300">chat_bubble</span>
                                <p className="text-xs font-semibold text-gray-500 mt-3">Chưa có cuộc trò chuyện nào</p>
                                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                    Khi được chấp nhận ứng tuyển, nhà tuyển dụng sẽ mở chat với bạn.
                                </p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => {
                                const lastMsg = conv.messages[0];
                                const isActive = conv.id === activeId && activeType === 'direct';
                                const hasUnread = conv.unreadCount > 0;
                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => selectConv(conv.id, 'direct')}
                                        className={`w-full text-left px-4 py-3.5 flex gap-3.5 items-start transition-all duration-150 cursor-pointer relative ${isActive
                                                ? 'bg-green-50/60 border-l-[3.5px] border-l-[#00b14f]'
                                                : hasUnread
                                                    ? 'bg-green-50/15 hover:bg-gray-50 border-l-[3.5px] border-l-transparent'
                                                    : 'hover:bg-gray-50 border-l-[3.5px] border-l-transparent'
                                            }`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <Avatar name={conv.employer?.company?.name || conv.employer?.name} avatar={conv.employer?.company?.logo || conv.employer?.avatar} size={10} />
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline gap-1">
                                                <p className={`text-[13px] truncate ${hasUnread ? 'font-bold text-[#041b3c]' : 'font-semibold text-[#041b3c]'
                                                    }`}>
                                                    {(conv.employer?.company?.name || conv.employer?.name) ?? 'Nhà tuyển dụng'}
                                                </p>
                                                <span className="text-[9px] text-gray-400 flex-shrink-0 font-medium">
                                                    {lastMsg ? formatDateVi(lastMsg.createdAt) : formatDateVi(conv.updatedAt)}
                                                </span>
                                            </div>
                                            {conv.application?.job?.title && (
                                                <p className="text-[11px] text-[#00b14f] font-semibold truncate mt-0.5">
                                                    {conv.application.job.title}
                                                </p>
                                            )}
                                            {lastMsg && (
                                                <p className={`text-xs truncate mt-1 ${hasUnread ? 'text-gray-900 font-bold' : 'text-gray-400'
                                                    }`}>
                                                    {lastMsg.senderId === currentUserId ? 'Bạn: ' : ''}{lastMsg.content}
                                                </p>
                                            )}
                                        </div>
                                        {hasUnread && (
                                            <span className="absolute right-4 bottom-4 bg-red-500 text-white text-[9px] font-bold min-w-[15px] h-3.5 px-0.5 rounded-full flex items-center justify-center shadow-[0_2px_4px_rgba(239,68,68,0.2)]">
                                                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )
                    ) : (
                        filteredGroupConvs.length === 0 ? (
                            <div className="px-6 py-16 text-center">
                                <span className="material-symbols-outlined text-[42px] text-gray-300">groups</span>
                                <p className="text-xs font-semibold text-gray-500 mt-3">Chưa có nhóm trò chuyện nào</p>
                                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                                    Nhà tuyển dụng sẽ thêm bạn vào nhóm hội thoại khi cần thiết.
                                </p>
                            </div>
                        ) : (
                            filteredGroupConvs.map(g => {
                                const lastMsg = g.messages?.[0];
                                const isActive = g.id === activeId && activeType === 'group';
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => selectConv(g.id, 'group')}
                                        className={`w-full text-left px-4 py-3.5 flex gap-3.5 items-start transition-all duration-150 cursor-pointer relative ${isActive
                                                ? 'bg-green-50/60 border-l-[3.5px] border-l-[#00b14f]'
                                                : 'hover:bg-gray-50 border-l-[3.5px] border-l-transparent'
                                            }`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <GroupAvatar name={g.name} size={10} />
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline gap-1">
                                                <p className={`text-[13px] truncate ${isActive ? 'text-[#00b14f] font-bold' : 'font-semibold text-[#041b3c]'}`}>
                                                    {g.name}
                                                </p>
                                                <span className="text-[9px] text-gray-400 flex-shrink-0 font-medium">
                                                    {formatDateVi(g.updatedAt)}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-450 truncate mt-0.5">
                                                {g.members.length} thành viên
                                            </p>
                                            {lastMsg && (
                                                <p className="text-xs truncate mt-1 text-gray-400">
                                                    {lastMsg.content}
                                                </p>
                                            )}
                                        </div>
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
                    <div className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between flex-shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                        <div className="flex items-center gap-3.5 min-w-0">
                            {activeType === 'group' && activeGroup ? (
                                <>
                                    <div className="relative">
                                        <GroupAvatar name={activeGroup.name} size={10} />
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-[#041b3c] text-[14px] truncate">{activeGroup.name}</p>
                                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                            {activeGroup.members.map(m => m.user.name).join(", ")}
                                        </p>
                                    </div>
                                </>
                            ) : activeConv ? (
                                <>
                                    <div className="relative flex-shrink-0">
                                        <Avatar name={activeConv.employer?.company?.name || activeConv.employer?.name} avatar={activeConv.employer?.company?.logo || activeConv.employer?.avatar} size={10} />
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-[#041b3c] text-[14px] truncate">
                                            {(activeConv.employer?.company?.name || activeConv.employer?.name) ?? 'Nhà tuyển dụng'}
                                        </p>
                                        {activeConv.application?.job && (
                                            <Link
                                                href={`/jobs/${activeConv.application.job.slug}`}
                                                className="text-[11px] text-[#00b14f] font-semibold hover:underline truncate block mt-0.5"
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
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                                title="Xóa cuộc hội thoại"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                                Xóa hội thoại
                            </button>
                        )}
                    </div>

                    {/* Messages list */}
                    <div ref={containerRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-gray-50/40">
                        {loadingMsgs && messages.length === 0 ? (
                            <div className="flex justify-center py-12">
                                <div className="w-7 h-7 border-2 border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <span className="material-symbols-outlined text-[48px] text-gray-200">chat</span>
                                <p className="text-sm font-semibold text-gray-400 mt-2">Chưa có tin nhắn nào</p>
                                <p className="text-xs text-gray-300 mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
                            </div>
                        ) : (
                            messages.map((msg, i) => {
                                const isMine = msg.sender.id === currentUserId;
                                const showDate =
                                    i === 0 ||
                                    new Date(messages[i - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                                return (
                                    <div key={msg.id} className="space-y-1">
                                        {showDate && (
                                            <div className="text-center my-4">
                                                <span className="text-[10px] font-semibold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                                                    {formatDateVi(msg.createdAt)}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`flex gap-2.5 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {!isMine && <Avatar name={msg.sender.name} avatar={msg.sender.avatar} size={8} />}
                                            <div className={`max-w-[70%] flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                                                {!isMine && activeType === 'group' && (
                                                    <p className="text-[10px] text-gray-400 font-semibold mb-0.5 ml-1">{msg.sender.name}</p>
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
                                                    <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm whitespace-pre-line ${isMine
                                                            ? 'bg-[#00b14f] text-white rounded-tr-sm shadow-green-600/5'
                                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                                                        }`}>
                                                        {msg.content}
                                                    </div>
                                                </div>
                                                <div className={`flex items-center gap-1.5 px-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-[9px] text-gray-350 font-medium">
                                                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isMine && (
                                                        <span className={`material-symbols-outlined text-[13px] ${msg.readAt ? 'text-[#00b14f] font-bold' : 'text-gray-350'
                                                            }`}>
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

                    {/* Floating input container */}
                    <div className="bg-white px-5 py-4 border-t border-gray-100 flex items-center gap-3.5 flex-shrink-0">
                        {/* Plus attachment icon placeholder */}
                        <button
                            className="w-9 h-9 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#00b14f] transition-all cursor-pointer flex-shrink-0"
                            title="Đính kèm"
                        >
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        </button>

                        {/* Textarea input wrapper */}
                        <div className="flex-1 relative flex items-center bg-gray-50 border border-gray-150 rounded-2xl px-4 py-2 focus-within:bg-white focus-within:border-[#00b14f] focus-within:ring-2 focus-within:ring-green-50/30 transition-all duration-200">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                                }}
                                placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
                                rows={1}
                                className="flex-1 bg-transparent resize-none text-[13px] text-gray-800 placeholder-gray-400 outline-none max-h-32 leading-relaxed self-center py-1.5"
                                style={{ minHeight: '24px' }}
                            />
                            {/* Smile button placeholder */}
                            <button className="text-gray-400 hover:text-[#00b14f] transition-colors cursor-pointer self-end mb-1 ml-2 flex-shrink-0">
                                <span className="material-symbols-outlined text-[18px]">sentiment_satisfied</span>
                            </button>
                        </div>

                        {/* Send button */}
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || sending}
                            className="w-10 h-10 bg-[#00b14f] hover:bg-[#009f47] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer shadow-sm shadow-[#00b14f]/15 hover:shadow-md active:scale-[0.98]"
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
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 bg-gray-50/15">
                    <span className="material-symbols-outlined text-[64px] text-gray-200">forum</span>
                    <p className="mt-3 font-semibold text-[#041b3c] text-sm">Chọn cuộc trò chuyện</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Để bắt đầu nhắn tin trao đổi trực tiếp với nhà tuyển dụng.
                    </p>
                </div>
            )}
        </div>
    );
}

export default function CandidateMessagesPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[calc(100vh-56px-40px)] items-center justify-center bg-[#f5f7fa] text-gray-400 font-sans">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#00b14f]"></div>
            </div>
        }>
            <CandidateMessagesPageContent />
        </Suspense>
    );
}