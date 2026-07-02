'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface JobRecommendation {
  id: string;
  title: string;
  slug: string;
  type: string;
  salaryMin: number | null;
  salaryMax: number | null;
  reason: string;
  company: {
    name: string;
    logo: string | null;
  };
  ward: {
    name: string;
  } | null;
}

interface Message {
  sender: 'ai' | 'user';
  text: string;
  jobs?: JobRecommendation[];
  isLoader?: boolean;
}

const SAMPLE_CVS = [
  {
    title: "CV Lập trình NodeJS",
    text: "Họ và tên: Nguyễn Văn A. Mục tiêu nghề nghiệp: Lập trình viên Backend NodeJS. Kinh nghiệm: 2 năm lập trình JavaScript, TypeScript, NodeJS, Express, NestJS, MySQL, MongoDB. Kỹ năng xây dựng RESTful API, tối ưu hóa truy vấn SQL, thiết kế cơ sở dữ liệu."
  },
  {
    title: "CV Lễ tân Khách sạn",
    text: "Họ và tên: Trần Thị B. Mục tiêu nghề nghiệp: Nhân viên lễ tân / Chăm sóc khách hàng. Kinh nghiệm: 1 năm làm lễ tân tại resort 4 sao ở Phú Quốc. Giao tiếp tiếng Anh trôi chảy, xử lý thủ tục nhận/trả phòng, giải quyết thắc mắc của du khách."
  },
  {
    title: "CV Kế toán tổng hợp",
    text: "Họ và tên: Phạm Văn C. Mục tiêu nghề nghiệp: Nhân viên kế toán tổng hợp. Kinh nghiệm: 3 năm làm báo cáo tài chính, kê khai thuế VAT, thuế TNCN, theo dõi công nợ khách hàng, sử dụng thành thạo phần mềm kế toán MISA."
  }
];

export default function ChatbotWidget() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldHide = [
    '/cv',
    '/sua-cv',
    '/tao-cv',
    '/admin',
    '/employer',
    '/candidate',
    '/login',
    '/register'
  ].some(prefix => pathname?.startsWith(prefix));

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý Tuyển dụng AI. Hãy cung cấp CV của bạn bằng cách chọn CV đã tạo trên hệ thống hoặc tải lên file PDF của bạn. Tôi sẽ quét các vị trí tuyển dụng phù hợp nhất gửi đến bạn!',
    },
  ]);
  const [userResumes, setUserResumes] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMsg = inputValue.trim();
    setInputValue('');

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: userMsg },
      { sender: 'ai', text: 'Đang phản hồi...', isLoader: true },
    ]);
    setLoading(true);

    try {
      const filteredHistory = messages
        .filter((m) => !m.isLoader)
        .map((m) => ({ sender: m.sender, text: m.text }));

      const response = await fetch('/api/public/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: filteredHistory,
        }),
      });

      const data = await response.json();
      setMessages((prev) => prev.filter((m) => !m.isLoader));

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: data.response },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: data.error || 'Có lỗi xảy ra trong quá trình phản hồi.' },
        ]);
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => !m.isLoader));
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check authentication and load user resumes
    async function initResumes() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const authData = await res.json();
          if (authData.user) {
            setIsLoggedIn(true);
            const resumeRes = await fetch('/api/candidate/resumes');
            if (resumeRes.ok) {
              const data = await resumeRes.json();
              setUserResumes(data.resumes || []);
            }
          } else {
            setIsLoggedIn(false);
            setUserResumes([]);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    initResumes();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSelectSampleCV = async (title: string, cvText: string) => {
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: `Chọn CV Mẫu: ${title}` },
      { sender: 'ai', text: 'Đang phân tích CV mẫu và tìm kiếm công việc...', isLoader: true },
    ]);
    setLoading(true);

    try {
      const response = await fetch('/api/public/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_text: cvText }),
      });

      const data = await response.json();
      setMessages((prev) => prev.filter((m) => !m.isLoader));

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: data.message,
            jobs: data.recommended_jobs || [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: data.error || 'Có lỗi xảy ra trong quá trình đối khớp.' },
        ]);
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => !m.isLoader));
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResume = async (resumeId: string, resumeTitle: string) => {
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: `Chọn CV trên hệ thống: ${resumeTitle}` },
      { sender: 'ai', text: 'Đang phân tích CV và tìm kiếm công việc...', isLoader: true },
    ]);
    setLoading(true);

    try {
      const response = await fetch('/api/public/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_id: resumeId }),
      });

      const data = await response.json();
      setMessages((prev) => prev.filter((m) => !m.isLoader));

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: data.message,
            jobs: data.recommended_jobs || [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: data.error || 'Có lỗi xảy ra trong quá trình đối khớp.' },
        ]);
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => !m.isLoader));
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Vui lòng tải lên file dạng PDF.');
      return;
    }

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: `Tải lên file CV: ${file.name}` },
      { sender: 'ai', text: 'Đang trích xuất văn bản và phân tích dữ liệu CV của bạn...', isLoader: true },
    ]);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/public/chatbot', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setMessages((prev) => prev.filter((m) => !m.isLoader));

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: data.message,
            jobs: data.recommended_jobs || [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: data.error || 'Có lỗi xảy ra khi xử lý file.' },
        ]);
      }
    } catch (error) {
      setMessages((prev) => prev.filter((m) => !m.isLoader));
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Không thể kết nối đến máy chủ để tải file.' },
      ]);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Thỏa thuận';
    if (min && max) return `${(min / 1000000).toFixed(0)}tr - ${(max / 1000000).toFixed(0)}tr`;
    if (min) return `Từ ${(min / 1000000).toFixed(0)}tr`;
    return `Đến ${((max as number) / 1000000).toFixed(0)}tr`;
  };

  if (!mounted || shouldHide) return null;

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#00b14f] hover:bg-[#009940] text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer transition-all duration-300 transform hover:scale-105 print:hidden"
        title="Trợ lý tìm việc AI"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <div className="relative">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
            </span>
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-[420px] h-[550px] bg-white rounded-3xl border border-gray-150 shadow-2xl flex flex-col overflow-hidden animate-[slideIn_0.3s_ease] font-sans print:hidden">
          <style>{`
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          
          {/* Header */}
          <div className="bg-[#00b14f] px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10A10 10 0 0 0 12 2zM9 13.5v-3m6 3v-3M9 16h6" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Trợ lý việc làm AI</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                <span className="text-[10px] text-white/80 font-medium">Đang hoạt động (Gemini-2.5)</span>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#f8faf9] flex flex-col gap-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#00b14f] text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.isLoader ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#00b14f] border-t-transparent rounded-full animate-spin" />
                      <span>{msg.text}</span>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>

                {/* Inline Job Recommendation Cards */}
                {msg.jobs && msg.jobs.length > 0 && (
                  <div className="mt-3 w-full flex flex-col gap-3">
                    {msg.jobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-white rounded-2xl p-4 border border-gray-150 shadow-sm flex flex-col gap-2.5 max-w-[360px]"
                      >
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {job.company.logo ? (
                              <img
                                src={job.company.logo}
                                alt={job.company.name}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <span className="text-base">🏢</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs text-gray-900 truncate">{job.title}</h4>
                            <p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">
                              {job.company.name}
                            </p>
                          </div>
                        </div>

                        {/* Salary and Location badges */}
                        <div className="flex gap-1.5 text-[10px]">
                          <span className="bg-[#f4f7f5] px-2 py-0.5 rounded text-gray-600 font-medium">
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </span>
                          <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium">
                            {job.type}
                          </span>
                        </div>

                        {/* AI matching reason */}
                        <div className="text-[11px] bg-green-50/50 border border-green-100/60 text-green-800 rounded-xl p-2.5 leading-relaxed font-normal">
                          <span className="font-bold text-green-900">💡 Lý do phù hợp:</span> {job.reason}
                        </div>

                        <Link
                          href={`/jobs/${job.slug}`}
                          target="_blank"
                          className="text-center bg-[#00b14f] hover:bg-[#009940] text-white font-bold text-[11px] py-2 rounded-xl transition-colors cursor-pointer mt-1"
                        >
                          Xem chi tiết & Ứng tuyển
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Action Input Area */}
          <div className="bg-white border-t border-gray-150 p-4 flex flex-col gap-2.5">
            {/* Direct File Input (hidden) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf"
              className="hidden"
              disabled={loading}
            />

            {/* Selection Options */}
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex-1 border border-gray-200 hover:border-[#00b14f] hover:text-[#00b14f] rounded-2xl py-2.5 text-xs text-gray-600 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Tải lên CV (PDF)
              </button>
            </div>

            {/* Database Resume Selection List */}
            {isLoggedIn && userResumes.length > 0 && (
              <div className="border-t border-gray-100 pt-2.5 flex flex-col gap-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Chọn CV của bạn:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
                  {userResumes.map((resume) => (
                    <button
                      key={resume.id}
                      onClick={() => handleSelectResume(resume.id, resume.title)}
                      disabled={loading}
                      className="bg-[#f4f7f5] hover:bg-[#00b14f] text-gray-700 hover:text-white border border-[#e2eae5] text-[11px] font-medium px-3 py-1.5 rounded-full transition-all cursor-pointer truncate max-w-[170px] disabled:opacity-50"
                    >
                      📄 {resume.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sample CV List for Testing */}
            <div className="border-t border-gray-100 pt-2 flex flex-col gap-1.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Chạy thử nghiệm nhanh bằng CV mẫu:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_CVS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSampleCV(sample.title, sample.text)}
                    disabled={loading}
                    className="bg-[#f0f9ff] hover:bg-[#0284c7] text-[#0284c7] hover:text-white border border-[#e0f2fe] text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer disabled:opacity-50"
                  >
                    💡 {sample.title}
                  </button>
                ))}
              </div>
            </div>

            {!isLoggedIn && (
              <p className="text-[10px] text-gray-400 text-center">
                Đăng nhập để chọn trực tiếp các hồ sơ CV bạn đã tạo trực tuyến.
              </p>
            )}

            {/* Form nhập câu hỏi */}
            <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-gray-100 pt-3 mt-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 border border-gray-200 focus:border-[#00b14f] focus:outline-none rounded-xl px-3 py-2 text-xs text-gray-800 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="bg-[#00b14f] hover:bg-[#009940] text-white rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                Gửi
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
