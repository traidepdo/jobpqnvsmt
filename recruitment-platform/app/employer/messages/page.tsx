"use client";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Sender = { id: string; name: string; avatar?: string | null };
type Message = { id: string; content: string; createdAt: string; readAt: string | null; sender: Sender };
type PreviewMessage = { id: string; content: string; createdAt: string; senderId: string };
type Conversation = {
    id: string;
    candidate: Sender;
    application: {
        id: string;
        job: { id: string; title: string; slug: string };
    };
    messages: PreviewMessage[];
    updatedAt: string;
    unreadCount: number;
};

type GroupConversation = {
    id: string;
    name: string;
    employerId: string;
    createdAt: string;
    updatedAt: string;
    members: { user: Sender }[];
    messages: PreviewMessage[];
};

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

function EmployerMessagesPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeId = searchParams.get("id");
    const activeType = searchParams.get("type") || "direct";

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [groupConvs, setGroupConvs] = useState<GroupConversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [myId, setMyId] = useState<string>("");
    
    // UI states
    const [activeTab, setActiveTab] = useState<"direct" | "group">("direct");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
    
    const activeConv = conversations.find(c => c.id === activeId);
    const activeGroup = groupConvs.find(g => g.id === activeId);

    // Candidates list for creating group
    const availableCandidates = useMemo(() => {
        const map = new Map<string, Sender>();
        conversations.forEach(c => {
            if (c.candidate?.id) {
                map.set(c.candidate.id, c.candidate);
            }
        });
        return Array.from(map.values());
    }, [conversations]);

    useEffect(() => {
        fetch("/api/auth/me").then(r => r.json()).then(d => setMyId(d.user?.id ?? ""));
    }, []);

    const loadConversations = async () => {
        const res = await fetch("/api/employer/conversations");
        if (res.ok) {
            const d = await res.json();
            setConversations(d.conversations ?? []);
        }
    };

    const loadGroupConversations = async () => {
        const res = await fetch("/api/employer/group-conversations");
        if (res.ok) {
            const d = await res.json();
            setGroupConvs(d.groups ?? []);
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa tin nhắn này không?")) return;
        try {
            const endpoint = activeType === "group"
                ? `/api/employer/group-conversations/${activeId}/messages/${msgId}`
                : `/api/employer/conversations/${activeId}/messages/${msgId}`;
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
                ? `/api/employer/group-conversations/${activeId}`
                : `/api/employer/conversations/${activeId}`;
            const res = await fetch(endpoint, { method: "DELETE" });
            if (res.ok) {
                router.push("/employer/messages", { scroll: false });
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

    useEffect(() => {
        loadConversations();
        loadGroupConversations();
        const interval = setInterval(() => {
            loadConversations();
            loadGroupConversations();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadMessages = async (convId: string, type: string) => {
        const endpoint = type === "group"
            ? `/api/employer/group-conversations/${convId}/messages`
            : `/api/employer/conversations/${convId}/messages`;
        const res = await fetch(endpoint);
        if (res.ok) {
            const d = await res.json();
            setMessages(d.messages ?? []);
        }
    };

    const markRead = async (convId: string) => {
        await fetch(`/api/employer/conversations/${convId}/read`, { method: "PATCH" });
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
        window.dispatchEvent(new Event('messages:read'));
    };

    useEffect(() => {
        if (!activeId) return;
        if (pollRef.current) clearInterval(pollRef.current);
        loadMessages(activeId, activeType);
        if (activeType === "direct") {
            markRead(activeId);
        }
        pollRef.current = setInterval(async () => {
            await loadMessages(activeId, activeType);
            if (activeType === "direct") {
                await markRead(activeId);
            }
        }, 3000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [activeId, activeType]);

    const selectConv = (id: string, type: "direct" | "group") => {
        router.push(`/employer/messages?id=${id}&type=${type}`, { scroll: false });
    };

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

    const sendMessage = async () => {
        if (!input.trim() || !activeId || sending) return;
        setSending(true);
        const content = input.trim();
        setInput("");
        try {
            const endpoint = activeType === "group"
                ? `/api/employer/group-conversations/${activeId}/messages`
                : `/api/employer/conversations/${activeId}/messages`;
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            const data = await res.json();
            if (data.message) {
                setMessages(prev => [...prev, data.message]);
                if (activeType === "group") {
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

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim() || selectedCandidates.length === 0) return;
        try {
            const res = await fetch("/api/employer/group-conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newGroupName.trim(),
                    candidateIds: selectedCandidates
                })
            });
            if (res.ok) {
                const data = await res.json();
                setShowCreateModal(false);
                setNewGroupName("");
                setSelectedCandidates([]);
                await loadGroupConversations();
                if (data.group?.id) {
                    selectConv(data.group.id, "group");
                    setActiveTab("group");
                }
            } else {
                const err = await res.json();
                alert(err.error || "Tạo nhóm thất bại");
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi khi tạo nhóm");
        }
    };

    const toggleCandidate = (cid: string) => {
        setSelectedCandidates(prev => 
            prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]
        );
    };

    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
        if (diff === 0) return "Hôm nay";
        if (diff === 1) return "Hôm qua";
        return d.toLocaleDateString("vi-VN");
    };

    return (
        <div className="flex h-[calc(100vh-64px-48px)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">

            {/* ── Sidebar ── */}
            <div className="w-80 flex-shrink-0 border-r border-gray-100 flex flex-col bg-white">
                {/* Header */}
                <div className="px-4 py-4 border-b border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-[#041b3c] text-base flex items-center gap-2">
                            Tin nhắn
                            {totalUnread > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {totalUnread > 99 ? "99+" : totalUnread}
                                </span>
                            )}
                        </h2>
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-1 text-xs font-semibold text-[#0052CC] hover:text-[#0040a2] cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[16px]">group_add</span>
                            Tạo nhóm
                        </button>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex border border-gray-100 rounded-lg p-0.5 bg-gray-50/60 mt-1">
                        <button
                            onClick={() => setActiveTab("direct")}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                activeTab === "direct" ? "bg-white text-[#0052CC] shadow-sm" : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            Cá nhân
                        </button>
                        <button
                            onClick={() => setActiveTab("group")}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                activeTab === "group" ? "bg-white text-[#0052CC] shadow-sm" : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            Nhóm
                        </button>
                    </div>
                </div>

                {/* List items */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === "direct" ? (
                        conversations.length === 0 ? (
                            <div className="py-16 text-center px-4">
                                <span className="material-symbols-outlined text-4xl text-gray-200 block mb-2">chat</span>
                                <p className="text-sm text-gray-400 font-medium">Chưa có tin nhắn nào</p>
                                <p className="text-xs text-gray-300 mt-1">Chấp nhận đơn ứng tuyển để bắt đầu chat</p>
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const lastMsg = conv.messages[0];
                                const isActive = conv.id === activeId && activeType === "direct";
                                const hasUnread = conv.unreadCount > 0;
                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => selectConv(conv.id, "direct")}
                                        className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-l-2 transition-all cursor-pointer
                                            ${isActive ? "bg-[#f0f4ff] border-[#0052CC]"
                                            : hasUnread ? "bg-blue-50/40 border-transparent hover:bg-blue-50/60"
                                            : "border-transparent hover:bg-gray-50"}`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <Avatar name={conv.candidate.name} avatar={conv.candidate.avatar} size={10} />
                                            {hasUnread && (
                                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                                                    {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className={`text-sm truncate ${isActive ? "font-bold text-[#0052CC]" : hasUnread ? "font-bold text-[#041b3c]" : "font-semibold text-[#041b3c]"}`}>
                                                    {conv.candidate.name}
                                                </p>
                                                <span className="text-[10px] text-gray-400 flex-shrink-0">{formatDate(conv.updatedAt)}</span>
                                            </div>
                                            <p className="text-xs text-[#0052CC] truncate mt-0.5">{conv.application.job.title}</p>
                                            {lastMsg && (
                                                <p className={`text-xs truncate mt-0.5 ${hasUnread ? "font-medium text-[#041b3c]" : "text-gray-400 italic"}`}>
                                                    {lastMsg.senderId === myId ? "Bạn: " : ""}{lastMsg.content}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )
                    ) : (
                        groupConvs.length === 0 ? (
                            <div className="py-16 text-center px-4">
                                <span className="material-symbols-outlined text-4xl text-gray-200 block mb-2">groups</span>
                                <p className="text-sm text-gray-400 font-medium">Chưa có nhóm trò chuyện</p>
                                <p className="text-xs text-gray-300 mt-1">Bấm "Tạo nhóm" ở trên để tạo nhóm chat mới</p>
                            </div>
                        ) : (
                            groupConvs.map(g => {
                                const lastMsg = g.messages?.[0];
                                const isActive = g.id === activeId && activeType === "group";
                                return (
                                    <button
                                        key={g.id}
                                        onClick={() => selectConv(g.id, "group")}
                                        className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-l-2 transition-all cursor-pointer
                                            ${isActive ? "bg-[#f0f4ff] border-[#0052CC]" : "border-transparent hover:bg-gray-50"}`}
                                    >
                                        <GroupAvatar name={g.name} size={10} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className={`text-sm truncate font-semibold text-[#041b3c] ${isActive ? "text-[#0052CC] font-bold" : ""}`}>
                                                    {g.name}
                                                </p>
                                                <span className="text-[10px] text-gray-400 flex-shrink-0">{formatDate(g.updatedAt)}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 truncate mt-0.5">
                                                {g.members.length} thành viên
                                            </p>
                                            {lastMsg && (
                                                <p className="text-xs truncate mt-0.5 text-gray-400">
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
            </div>

            {/* ── Khung chat ── */}
            {activeId && (activeConv || activeGroup) ? (
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {/* Header */}
                    <div className="h-16 px-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
                        <div className="flex items-center gap-3 min-w-0">
                            {activeType === "group" && activeGroup ? (
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
                                    <Avatar name={activeConv.candidate.name} avatar={activeConv.candidate.avatar} size={9} />
                                    <div className="min-w-0">
                                        <p className="font-bold text-[#041b3c] text-sm truncate">{activeConv.candidate.name}</p>
                                        <Link
                                            href={`/jobs/${activeConv.application.job.slug}`}
                                            target="_blank"
                                            className="text-xs text-[#0052CC] hover:underline truncate block"
                                        >
                                            {activeConv.application.job.title}
                                        </Link>
                                    </div>
                                </>
                            ) : null}
                        </div>
                        
                        <button
                            onClick={handleDeleteConversation}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                            title="Xóa cuộc hội thoại"
                        >
                            <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                            Xóa hội thoại
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={containerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#f8faff]">
                        {messages.length === 0 && (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-4xl text-gray-200 block mb-2">waving_hand</span>
                                <p className="text-sm text-gray-400">Hãy gửi tin nhắn đầu tiên!</p>
                            </div>
                        )}
                        {messages.map((msg, i) => {
                            const isMe = msg.sender.id === myId;
                            const showDate =
                                i === 0 ||
                                new Date(messages[i - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                            return (
                                <div key={msg.id}>
                                    {showDate && (
                                        <div className="text-center my-3">
                                            <span className="text-[11px] text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
                                                {formatDate(msg.createdAt)}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`flex items-end gap-2 group ${isMe ? "flex-row-reverse" : ""}`}>
                                        {!isMe && <Avatar name={msg.sender.name} avatar={msg.sender.avatar} size={7} />}
                                        <div className="max-w-[65%]">
                                            {!isMe && activeType === "group" && (
                                                <p className="text-[10px] text-gray-400 mb-0.5 ml-1">{msg.sender.name}</p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                {isMe && (
                                                    <button
                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-red-500 cursor-pointer flex-shrink-0"
                                                        title="Xóa tin nhắn"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    </button>
                                                )}
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                                    ${isMe
                                                        ? "bg-[#0052CC] text-white rounded-br-sm"
                                                        : "bg-white text-[#041b3c] rounded-bl-sm border border-gray-100 shadow-sm"
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                            <div className={`flex items-center gap-1 mt-1 ${isMe ? "flex-row-reverse" : ""}`}>
                                                <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                                                {isMe && (
                                                    <span className={`material-symbols-outlined text-[12px] ${msg.readAt ? "text-[#0052CC]" : "text-gray-300"}`}>
                                                        done_all
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-end gap-3">
                        <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-[#0052CC] focus-within:bg-white transition-all px-4 py-2.5">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                                }}
                                placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
                                rows={1}
                                className="w-full bg-transparent text-sm text-[#041b3c] placeholder-gray-400 resize-none outline-none max-h-32"
                            />
                        </div>
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || sending}
                            className="w-10 h-10 rounded-xl bg-[#0052CC] hover:bg-[#0040a2] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all flex-shrink-0 shadow-sm cursor-pointer"
                        >
                            {sending ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined text-[20px]">send</span>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-[#f8faff] gap-3">
                    <div className="w-20 h-20 rounded-3xl bg-[#f0f4ff] flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-[#0052CC]/40">forum</span>
                    </div>
                    <p className="font-bold text-[#041b3c]">Chọn cuộc trò chuyện</p>
                    <p className="text-sm text-gray-400">Chọn một ứng viên hoặc nhóm bên trái để bắt đầu nhắn tin</p>
                </div>
            )}

            {/* ── Modal tạo nhóm ── */}
            {showCreateModal && (
                <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl flex flex-col max-h-[90%]">
                        <h3 className="font-bold text-lg text-[#041b3c] mb-4">Tạo nhóm nhắn tin</h3>
                        
                        <form onSubmit={handleCreateGroup} className="flex-1 flex flex-col min-h-0 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Tên nhóm</label>
                                <input
                                    type="text"
                                    required
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    placeholder="Nhập tên nhóm..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0052CC] transition-all"
                                />
                            </div>

                            <div className="flex-1 flex flex-col min-h-0">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Chọn thành viên</label>
                                <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50/50 space-y-1">
                                    {availableCandidates.length === 0 ? (
                                        <p className="text-xs text-gray-400 p-4 text-center">Chưa có ứng viên khả dụng</p>
                                    ) : (
                                        availableCandidates.map(cand => (
                                            <label 
                                                key={cand.id}
                                                className="flex items-center gap-3 p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-100 transition-all cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCandidates.includes(cand.id)}
                                                    onChange={() => toggleCandidate(cand.id)}
                                                    className="w-4 h-4 text-[#0052CC] border-gray-300 rounded focus:ring-[#0052CC]"
                                                />
                                                <Avatar name={cand.name} avatar={cand.avatar} size={7} />
                                                <span className="text-sm font-medium text-gray-700">{cand.name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewGroupName("");
                                        setSelectedCandidates([]);
                                    }}
                                    className="px-4 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-semibold cursor-pointer transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newGroupName.trim() || selectedCandidates.length === 0}
                                    className="px-5 py-2 rounded-xl bg-[#0052CC] text-white hover:bg-[#0040a2] disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold cursor-pointer transition-all"
                                >
                                    Tạo nhóm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EmployerMessagesPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[calc(100vh-64px-48px)] items-center justify-center bg-white text-gray-500 font-sans">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#0052CC]"></div>
            </div>
        }>
            <EmployerMessagesPageContent />
        </Suspense>
    );
}