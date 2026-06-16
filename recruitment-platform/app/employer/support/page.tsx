'use client';

// app/employer/messages/page.tsx
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

export default function EmployerMessagesPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/api/employer/admin-conversations')
            .then(r => r.json())
            .then(d => {
                setConversationId(d.conversation?.id || null);
                setMessages(d.conversation?.messages || []);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!content.trim()) return;
        setSending(true);
        const res = await fetch('/api/employer/admin-conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        });
        if (res.ok) {
            const { message } = await res.json();
            setMessages(m => [...m, message]);
            setContent('');
        }
        setSending(false);
    };

    return (
        <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-120px)]">
            {/* Header */}
            <div className="bg-white rounded-t-xl border border-b-0 border-gray-100 px-5 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0052CC] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    A
                </div>
                <div>
                    <p className="font-bold text-[#041b3c] text-sm">Hỗ trợ Admin</p>
                    <p className="text-xs text-gray-400">Thường phản hồi trong vài giờ</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 bg-white border-x border-gray-100 overflow-y-auto px-5 py-4 space-y-3">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-[3px] border-gray-200 border-t-[#0052CC] rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-[#0052CC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Liên hệ với Admin</p>
                        <p className="text-xs text-gray-400 mt-1">Hỏi về tin bị ẩn, chính sách, hoặc bất kỳ vấn đề gì</p>
                    </div>
                ) : (
                    messages.map(msg => {
                        const isMe = msg.sender.role !== 'ADMIN';
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {!isMe && (
                                    <div className="w-7 h-7 rounded-full bg-[#0052CC] flex items-center justify-center text-white font-bold text-xs mr-2 flex-shrink-0 self-end mb-1">
                                        A
                                    </div>
                                )}
                                <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-[#0052CC] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: vi })}
                                        {isMe && msg.readAt && ' · Đã xem'}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="bg-white rounded-b-xl border border-t border-gray-100 px-4 py-3 flex gap-2 items-end">
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Nhập tin nhắn... (Enter để gửi)"
                    rows={2}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 resize-none"
                />
                <button
                    onClick={handleSend}
                    disabled={sending || !content.trim()}
                    className="px-4 py-2.5 bg-[#0052CC] text-white rounded-xl font-bold text-sm disabled:opacity-50 flex-shrink-0"
                >
                    {sending ? '...' : 'Gửi'}
                </button>
            </div>
        </div>
    );
}