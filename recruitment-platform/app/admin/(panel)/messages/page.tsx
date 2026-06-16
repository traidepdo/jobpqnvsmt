'use client';

// app/admin/messages/page.tsx
import { useEffect, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Message {
    id: string;
    content: string;
    createdAt: string;
    readAt: string | null;
    sender: { id: string; name: string; role: string };
}

interface Conversation {
    id: string;
    updatedAt: string;
    isNew: boolean;
    isMine: boolean;
    unread: number;
    employer: { id: string; name: string; email: string };
    messages: { content: string; createdAt: string }[];
}

export default function AdminMessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeConv, setActiveConv] = useState<{ employer: { id: string; name: string; email: string } } | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const loadConversations = () => {
        fetch('/api/admin/admin-conversations')
            .then(r => r.json())
            .then(d => setConversations(d.conversations || []));
    };

    const openConversation = (id: string) => {
        setActiveId(id);
        setLoadingMsgs(true);
        fetch(`/api/admin/admin-conversations/${id}/messages`)
            .then(r => r.json())
            .then(d => {
                setMessages(d.messages || []);
                setActiveConv(d.conversation || null);
                // Sau khi claim, reload list để các admin khác thấy đã có người nhận
                loadConversations();
            })
            .finally(() => setLoadingMsgs(false));
    };

    useEffect(() => { loadConversations(); }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!content.trim() || !activeId) return;
        setSending(true);
        const res = await fetch(`/api/admin/admin-conversations/${activeId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        });
        if (res.ok) {
            const { message } = await res.json();
            setMessages(m => [...m, message]);
            setContent('');
            loadConversations();
        }
        setSending(false);
    };

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

    return (
        <div className="flex h-[calc(100vh-120px)] max-w-6xl bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 flex-shrink-0 border-r border-gray-100 flex flex-col">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <h2 className="font-bold text-[#041b3c]">Tin nhắn từ Employer</h2>
                        {totalUnread > 0 && (
                            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                                {totalUnread > 9 ? '9+' : totalUnread}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{conversations.length} cuộc trò chuyện</p>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center mt-8 px-4">Chưa có tin nhắn nào</p>
                    ) : (
                        conversations.map(c => (
                            <button
                                key={c.id}
                                onClick={() => openConversation(c.id)}
                                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${activeId === c.id ? 'bg-blue-50' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <p className={`text-sm truncate ${c.unread > 0 ? 'font-bold text-[#041b3c]' : 'font-semibold text-gray-700'}`}>
                                                {c.employer.name}
                                            </p>
                                            {c.isNew && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 flex-shrink-0">
                                                    Mới
                                                </span>
                                            )}
                                            {c.isMine && !c.isNew && (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                                                    Của tôi
                                                </span>
                                            )}
                                            {!c.isNew && !c.isMine && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 flex-shrink-0">
                                                    Đã xử lý
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 truncate">{c.employer.email}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">{c.messages[0]?.content || ''}</p>
                                        <p className="text-[10px] text-gray-300 mt-0.5">
                                            {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true, locale: vi })}
                                        </p>
                                    </div>
                                    {c.unread > 0 && (
                                        <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                                            {c.unread > 9 ? '9+' : c.unread}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                {activeId ? (
                    <>
                        <div className="px-5 py-3 border-b border-gray-100">
                            <a href={`/admin/employer/${activeConv?.employer.id}`}>
                                <p className="font-bold text-[#041b3c] text-sm">
                                    {activeConv?.employer.name}
                                    <span className="text-gray-400 font-normal ml-2 text-xs">{activeConv?.employer.email}</span>
                                </p>
                            </a>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                            {loadingMsgs ? (
                                <div className="flex justify-center py-10">
                                    <div className="w-8 h-8 border-[3px] border-gray-200 border-t-[#0052CC] rounded-full animate-spin" />
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const isAdmin = msg.sender.role === 'ADMIN';
                                    return (
                                        <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            {!isAdmin && (
                                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs mr-2 flex-shrink-0 self-end mb-1">
                                                    {msg.sender.name?.[0]?.toUpperCase() || 'E'}
                                                </div>
                                            )}
                                            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${isAdmin ? 'bg-[#0052CC] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                                {!isAdmin && (
                                                    <p className="text-[10px] font-bold text-gray-500 mb-1">{msg.sender.name}</p>
                                                )}
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                                <p className={`text-[10px] mt-1 ${isAdmin ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: vi })}
                                                    {isAdmin && msg.readAt && ' · Đã xem'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>

                        <div className="px-5 py-3 border-t border-gray-100 flex gap-2 items-end">
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder="Nhập phản hồi... (Enter để gửi)"
                                rows={2}
                                className="text-black flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 resize-none"
                            />
                            <button
                                onClick={handleSend}
                                disabled={sending || !content.trim()}
                                className="px-4 py-2.5 bg-[#0052CC] text-white rounded-xl font-bold text-sm disabled:opacity-50"
                            >
                                {sending ? '...' : 'Gửi'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                        Chọn một cuộc trò chuyện để xem
                    </div>
                )}
            </div>
        </div>
    );
}