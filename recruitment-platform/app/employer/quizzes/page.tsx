'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaPlus, FaTrash, FaEdit, FaHourglassHalf, FaFileAlt } from 'react-icons/fa';

interface QuizItem {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number;
  createdAt: string;
  _count: {
    questions: number;
    jobs: number;
  };
}

export default function EmployerQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/employer/quizzes');
      const data = await res.json();
      if (res.ok) {
        setQuizzes(data.quizzes || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này? Hành động này không thể hoàn tác.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/employer/quizzes/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setQuizzes(quizzes.filter(q => q.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || 'Xóa thất bại');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0052CC] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#041b3c]">Quản lý bài kiểm tra năng lực</h2>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập các bài test trắc nghiệm để đính kèm vào tin đăng tuyển dụng nhằm lọc ứng viên.
          </p>
        </div>
        <Link
          href="/employer/quizzes/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0052CC] hover:bg-[#0040a2] text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0 cursor-pointer text-center justify-center"
        >
          <FaPlus size={10} /> Tạo bài test mới
        </Link>
      </div>

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0052CC] flex items-center justify-center mx-auto mb-4">
            <FaFileAlt size={24} />
          </div>
          <h3 className="text-base font-bold text-gray-800">Chưa có bài kiểm tra nào</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
            Hãy tạo bài thi trắc nghiệm đầu tiên của bạn để đánh giá năng lực ứng viên một cách tự động.
          </p>
          <Link
            href="/employer/quizzes/new"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-[#0052CC] hover:bg-[#0040a2] text-white text-xs font-bold rounded-xl transition"
          >
            <FaPlus size={10} /> Tạo ngay bài test
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-base font-extrabold text-[#041b3c] leading-snug line-clamp-1">
                    {quiz.title}
                  </h3>
                  <div className="flex items-center gap-1 bg-blue-50 text-[#0052CC] text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    <FaHourglassHalf size={10} /> {quiz.timeLimit} phút
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2 min-h-[32px]">
                  {quiz.description || 'Không có mô tả.'}
                </p>

                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 font-medium">
                  <div>
                    Số câu hỏi: <span className="font-bold text-[#041b3c]">{quiz._count.questions}</span>
                  </div>
                  <div className="h-3 w-px bg-gray-200" />
                  <div>
                    Đang gắn trong: <span className="font-bold text-[#041b3c]">{quiz._count.jobs} tin tuyển</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                <span className="text-[10px] text-gray-400 font-semibold">
                  Tạo ngày: {new Date(quiz.createdAt).toLocaleDateString('vi-VN')}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/employer/quizzes/${quiz.id}`}
                    className="p-2 text-gray-500 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <FaEdit size={14} />
                  </Link>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    disabled={deletingId === quiz.id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    title="Xóa bài test"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
