'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { JobDetails } from '@/components/jobs/JobDetailsClient';

interface JobApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobDetails;
  userResumes: any[];
  user: any;
  onApplySuccess: (newApplication: any) => void;
}

export default function JobApplyModal({
  isOpen,
  onClose,
  job,
  userResumes,
  user,
  onApplySuccess,
}: JobApplyModalProps) {
  const router = useRouter();

  // Local Form states
  const [coverLetter, setCoverLetter] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    if (userResumes && userResumes.length > 0) {
      const defaultResume = userResumes.find((r: any) => r.isDefault);
      if (defaultResume) {
        setSelectedResumeId(defaultResume.id);
      }
    }
  }, [userResumes]);

  // Quiz states
  const [quizPhase, setQuizPhase] = useState<'none' | 'info' | 'quiz'>('none');
  const [quizData, setQuizData] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleQuizSubmit = (auto = false) => {
    const answersList = quizQuestions.map(q => ({
      questionId: q.id,
      selectedOption: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
    }));
    submitApplication(answersList);
  };

  const submitApplication = async (answersList?: any[]) => {
    setApplyLoading(true);
    try {
      let uploadedCvUrl = null;
      if (cvFile) {
        const formData = new FormData();
        formData.append('file', cvFile);
        const uploadRes = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Tải file CV lên thất bại.');
        }
        const uploadData = await uploadRes.json();
        uploadedCvUrl = uploadData.url;
      }

      const payload: any = {
        jobId: job.id,
        coverLetter,
        resumeId: selectedResumeId || null,
        cvUrl: uploadedCvUrl || null,
      };

      if (job.quizId && answersList) {
        payload.quizAnswers = answersList;
        if (quizStartTime) {
          payload.quizDuration = Math.round((Date.now() - quizStartTime) / 1000);
        }
      }

      const res = await fetch('/api/candidate/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData.application) {
          onApplySuccess(resData.application);
        }
        setApplySuccess(true);
        setTimeout(() => {
          setApplySuccess(false);
          setCoverLetter('');
          setSelectedResumeId('');
          setCvFile(null);
          setQuizPhase('none');
          setQuizData(null);
          setQuizQuestions([]);
          setSelectedAnswers({});
          setCurrentQuestionIndex(0);
          onClose();
        }, 2500);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể nộp hồ sơ. Vui lòng thử lại.');
      }
    } catch (e: any) {
      alert(e.message || 'Đã xảy ra lỗi khi nộp hồ sơ.');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push(`/login?callbackUrl=/jobs/${job.slug}`); return; }
    if (user.role !== 'CANDIDATE') { alert('Tài khoản của bạn không phải là tài khoản ứng viên.'); return; }
    if (!selectedResumeId && !cvFile) { alert('Vui lòng chọn CV hoặc tải file lên.'); return; }

    if (job.quizId) {
      setApplyLoading(true);
      try {
        const res = await fetch(`/api/candidate/quizzes/${job.quizId}`);
        if (!res.ok) throw new Error('Không thể tải bài kiểm tra');
        const data = await res.json();
        if (data.quiz) {
          setQuizData(data.quiz);
          setQuizQuestions(data.quiz.questions || []);
          setQuizPhase('info');
        } else {
          throw new Error('Dữ liệu bài thi không hợp lệ');
        }
      } catch (err: any) {
        alert(err.message || 'Lỗi tải bài thi. Vui lòng thử lại.');
      } finally {
        setApplyLoading(false);
      }
      return;
    }

    submitApplication();
  };

  useEffect(() => {
    if (quizPhase !== 'quiz' || timeLeft <= 0) {
      if (quizPhase === 'quiz' && timeLeft <= 0) {
        alert('Hết thời gian làm bài! Hệ thống tự động nộp bài thi của bạn.');
        handleQuizSubmit(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [quizPhase, timeLeft]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease]"
        style={{ animation: 'slideUp 0.25s ease' }}>
        <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Ứng tuyển vị trí</h3>
            <p className="text-xs text-[#00b14f] font-semibold mt-0.5">{job.title} · {job.company.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {applySuccess ? (
          <div className="py-14 text-center flex flex-col items-center gap-3 px-6">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-1">
              <svg className="w-8 h-8 text-[#00b14f]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h4 className="text-base font-bold text-gray-900">Ứng tuyển thành công!</h4>
            <p className="text-sm text-gray-500">Hồ sơ đã được gửi. Nhà tuyển dụng sẽ liên hệ sớm nhất.</p>
          </div>
        ) : quizPhase === 'info' ? (
          <div className="p-6 flex flex-col gap-5 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#0052CC]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Yêu cầu kiểm tra năng lực</h4>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Để ứng tuyển vị trí này, nhà tuyển dụng yêu cầu bạn hoàn thành một bài trắc nghiệm nhanh. Kết quả sẽ được lưu cùng hồ sơ ứng tuyển của bạn.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl text-left">
              <div>
                <span className="text-[10px] text-gray-400 font-semibold block uppercase">Tên bài thi</span>
                <span className="text-xs font-bold text-gray-800">{quizData?.title}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-semibold block uppercase">Thời gian làm bài</span>
                <span className="text-xs font-bold text-gray-800">{quizData?.timeLimit} phút</span>
              </div>
              <div className="col-span-2 border-t border-gray-150 pt-2.5 mt-1">
                <span className="text-[10px] text-gray-400 font-semibold block uppercase">Số lượng câu hỏi</span>
                <span className="text-xs font-bold text-gray-800">{quizQuestions.length} câu hỏi trắc nghiệm</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuizPhase('none')}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 font-semibold hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeLeft(quizData.timeLimit * 60);
                  setQuizPhase('quiz');
                  setQuizStartTime(Date.now());
                  setCurrentQuestionIndex(0);
                }}
                className="flex-1 py-3 bg-[#00b14f] hover:bg-[#009940] text-white rounded-xl text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                Bắt đầu làm bài
              </button>
            </div>
          </div>
        ) : quizPhase === 'quiz' && quizQuestions.length > 0 ? (
          <div className="p-6 flex flex-col gap-4">
            {/* Timer & Progress */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-semibold text-gray-500">
                Câu hỏi {currentQuestionIndex + 1} / {quizQuestions.length}
              </span>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'
                }`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth={2} />
                  <path d="M12 6v6l4 2" strokeWidth={2} />
                </svg>
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#00b14f] h-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
              />
            </div>

            {/* Question Box */}
            <div className="my-2">
              <h4 className="text-sm font-bold text-gray-900 leading-snug mb-4">
                {quizQuestions[currentQuestionIndex].content}
              </h4>

              {/* Options */}
              <div className="flex flex-col gap-2.5">
                {quizQuestions[currentQuestionIndex].options.map((opt: string, idx: number) => {
                  const qId = quizQuestions[currentQuestionIndex].id;
                  const isSelected = selectedAnswers[qId] === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAnswers(prev => ({ ...prev, [qId]: idx }))}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all duration-200 cursor-pointer ${isSelected
                        ? 'border-[#00b14f] bg-green-50/40 text-[#00b14f] font-semibold'
                        : 'border-gray-150 hover:border-gray-300 hover:bg-gray-50/50 text-gray-700'
                        }`}
                    >
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border mr-3 text-[10px] font-bold transition-colors ${isSelected ? 'border-[#00b14f] bg-[#00b14f] text-white' : 'border-gray-300 text-gray-400 bg-white'
                        }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation footer */}
            <div className="flex gap-3 pt-3 border-t border-gray-100 mt-2">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="px-4 py-3 border border-gray-200 rounded-xl text-xs text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-45 cursor-pointer transition-colors"
              >
                Quay lại
              </button>

              <div className="flex-1" />

              {currentQuestionIndex < quizQuestions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="px-6 py-3 bg-[#00b14f] hover:bg-[#009940] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Tiếp theo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleQuizSubmit(false)}
                  disabled={applyLoading}
                  className="px-6 py-3 bg-[#00b14f] hover:bg-[#009940] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                >
                  {applyLoading ? 'Đang nộp...' : 'Nộp bài & Ứng tuyển'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleApplySubmit} className="p-6 flex flex-col gap-4">

            {/* CV selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Chọn CV ứng tuyển</label>
              {userResumes.length > 0 ? (
                <select
                  value={selectedResumeId}
                  onChange={e => setSelectedResumeId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-[#00b14f] transition-colors cursor-pointer"
                >
                  <option value="">-- Chọn CV đã tạo --</option>
                  {userResumes.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.title} {r.isDefault ? ' (Mặc định)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="border border-dashed border-green-200 bg-green-50/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-2">Bạn chưa có CV trên hệ thống</p>
                  <button type="button" onClick={() => router.push('/tao-cv')}
                    className="text-xs font-semibold bg-[#00b14f] text-white px-4 py-1.5 rounded-lg hover:bg-[#009940] cursor-pointer transition-colors">
                    Tạo CV ngay
                  </button>
                </div>
              )}
            </div>

            {/* File upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Hoặc tải CV từ máy (PDF, Word)</label>
              <label className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-[#00b14f] transition-colors bg-gray-50/50">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <span className="text-xs text-gray-500 flex-1">{cvFile ? cvFile.name : 'Chọn file...'}</span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files?.[0] || null)} className="hidden" />
                <span className="text-xs text-[#00b14f] font-semibold">Tải lên</span>
              </label>
            </div>

            {/* Cover letter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Thư giới thiệu <span className="font-normal text-gray-400">(tuỳ chọn)</span></label>
              <textarea
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                rows={4}
                placeholder="Giới thiệu ngắn về bản thân và lý do bạn phù hợp..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 resize-none outline-none focus:border-[#00b14f] transition-colors placeholder-gray-300"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 font-semibold hover:bg-gray-50 cursor-pointer transition-colors">
                Huỷ
              </button>
              <button type="submit"
                disabled={applyLoading || (!selectedResumeId && !cvFile)}
                className="flex-1 py-3 bg-[#00b14f] hover:bg-[#009940] text-white rounded-xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {applyLoading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang tải bài thi...</>
                ) : (job.quizId ? 'Tiếp tục làm bài test' : 'Gửi hồ sơ')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
