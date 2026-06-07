'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaTrash, FaCheck, FaSave, FaArrowLeft } from 'react-icons/fa';

interface QuestionItem {
  id?: string;
  content: string;
  options: string[];
  correctOption: number;
}

interface QuizFormProps {
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    timeLimit: number;
    questions: QuestionItem[];
  };
  isEdit?: boolean;
}

export default function QuizForm({ initialData, isEdit = false }: QuizFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || 15);
  const [questions, setQuestions] = useState<QuestionItem[]>(
    initialData?.questions || [
      { content: '', options: ['', '', '', ''], correctOption: 0 }
    ]
  );
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { content: '', options: ['', '', '', ''], correctOption: 0 }]);
  };

  const removeQuestion = (qIndex: number) => {
    if (questions.length === 1) {
      alert('Bài kiểm tra phải có ít nhất 1 câu hỏi.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== qIndex));
  };

  const handleQuestionChange = (qIndex: number, field: keyof QuestionItem, value: any) => {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], [field]: value };
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    const options = [...updated[qIndex].options];
    options[oIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options };
    setQuestions(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng điền tiêu đề bài test.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) {
        alert(`Nội dung câu hỏi thứ ${i + 1} đang để trống.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          alert(`Đáp án thứ ${j + 1} của câu hỏi ${i + 1} đang để trống.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `/api/employer/quizzes/${initialData?.id}` : '/api/employer/quizzes';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          timeLimit: Number(timeLimit),
          questions,
        }),
      });

      if (res.ok) {
        alert(isEdit ? 'Cập nhật bài kiểm tra thành công!' : 'Tạo bài kiểm tra thành công!');
        router.push('/employer/quizzes');
      } else {
        const err = await res.json();
        alert(err.error || 'Lưu thất bại');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top action header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
        <button
          type="button"
          onClick={() => router.push('/employer/quizzes')}
          className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition cursor-pointer"
        >
          <FaArrowLeft size={10} /> Quay lại danh sách
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0052CC] hover:bg-[#0040a2] disabled:bg-gray-400 text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          <FaSave size={12} /> {saving ? 'Đang lưu...' : 'Lưu bài kiểm tra'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Basic settings */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 h-fit">
          <h3 className="text-sm font-bold text-[#041b3c]">Thông tin bài kiểm tra</h3>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Tiêu đề bài test</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-[#0052CC] focus:outline-none"
              placeholder="Ví dụ: Kiểm tra chuyên môn Frontend React"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Mô tả bài test</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#0052CC] focus:outline-none resize-y"
              rows={3}
              placeholder="Nhập hướng dẫn làm bài cho ứng viên..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Thời gian làm bài (Phút)</label>
            <select
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-[#0052CC] focus:outline-none cursor-pointer"
            >
              <option value={5}>5 phút</option>
              <option value={10}>10 phút</option>
              <option value={15}>15 phút</option>
              <option value={20}>20 phút</option>
              <option value={30}>30 phút</option>
              <option value={45}>45 phút</option>
              <option value={60}>60 phút</option>
            </select>
          </div>
        </div>

        {/* Right Panel: Questions editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">Bộ câu hỏi trắc nghiệm ({questions.length} câu)</h3>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-1 text-xs text-[#0052CC] hover:underline font-bold cursor-pointer"
            >
              <FaPlus size={10} /> Thêm câu hỏi
            </button>
          </div>

          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs relative space-y-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-[#0052CC] bg-blue-50 px-2.5 py-1 rounded-lg">
                  Câu hỏi {qIndex + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                  title="Xóa câu hỏi này"
                >
                  <FaTrash size={12} />
                </button>
              </div>

              <div>
                <input
                  type="text"
                  value={q.content}
                  onChange={(e) => handleQuestionChange(qIndex, 'content', e.target.value)}
                  className="w-full text-sm font-semibold border-b border-gray-200 hover:border-gray-300 focus:border-[#0052CC] focus:outline-none pb-1"
                  placeholder="Nhập nội dung câu hỏi..."
                  required
                />
              </div>

              {/* Answers Options */}
              <div className="space-y-2.5">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Đáp án lựa chọn (Tick xanh là đáp án đúng)</label>
                {q.options.map((option, oIndex) => {
                  const isCorrect = q.correctOption === oIndex;
                  return (
                    <div key={oIndex} className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleQuestionChange(qIndex, 'correctOption', oIndex)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition shrink-0 cursor-pointer ${
                          isCorrect
                            ? 'bg-[#00b14f] border-[#00b14f] text-white'
                            : 'border-gray-200 hover:border-[#00b14f]'
                        }`}
                        title="Chọn làm đáp án đúng"
                      >
                        {isCorrect && <FaCheck size={10} />}
                      </button>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#0052CC] focus:outline-none"
                        placeholder={`Đáp án ${String.fromCharCode(65 + oIndex)}`}
                        required
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-3 border-2 border-dashed border-gray-200 hover:border-[#0052CC] rounded-2xl text-xs text-gray-500 hover:text-[#0052CC] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer bg-white"
          >
            <FaPlus size={10} /> Thêm câu hỏi trắc nghiệm
          </button>
        </div>
      </div>
    </form>
  );
}
