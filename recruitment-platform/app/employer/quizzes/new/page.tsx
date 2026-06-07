'use client';

import React from 'react';
import QuizForm from '@/components/employer/QuizForm';

export default function NewQuizPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <h2 className="text-xl font-extrabold text-[#041b3c]">Tạo bài kiểm tra trắc nghiệm mới</h2>
        <p className="text-xs text-gray-500 mt-1">
          Thiết kế các câu hỏi trắc nghiệm và câu trả lời chính xác cho bài thi của ứng viên.
        </p>
      </div>
      <QuizForm />
    </div>
  );
}
