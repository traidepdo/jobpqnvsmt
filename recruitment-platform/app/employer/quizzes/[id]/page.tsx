'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QuizForm from '@/components/employer/QuizForm';

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await fetch(`/api/employer/quizzes/${id}`);
        const data = await res.json();
        if (res.ok) {
          setQuiz(data.quiz);
        } else {
          alert(data.error || 'Không thể tải chi tiết bài thi');
          router.push('/employer/quizzes');
        }
      } catch (error) {
        console.error(error);
        alert('Lỗi kết nối');
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0052CC] rounded-full animate-spin" />
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <h2 className="text-xl font-extrabold text-[#041b3c]">Chỉnh sửa bài kiểm tra trắc nghiệm</h2>
        <p className="text-xs text-gray-500 mt-1">
          Chỉnh sửa nội dung câu hỏi, đáp án hoặc thời gian làm bài của ứng viên.
        </p>
      </div>
      <QuizForm initialData={quiz} isEdit={true} />
    </div>
  );
}
