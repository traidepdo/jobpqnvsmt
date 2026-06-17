'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const JobMapPicker = dynamic(() => import('./JobMapPicker'), {
  ssr: false,
  loading: () => <div className="h-48 w-full bg-gray-50 border border-dashed rounded-xl flex items-center justify-center text-xs text-gray-400">Đang tải bản đồ định vị...</div>
});

export interface JobFormValues {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  quantity: string;
  salaryMin: string;
  salaryMax: string;
  wardId: string;
  addressDetail: string;
  type: string;
  experience: string;
  level: string;
  deadline: string;
  categoryId: string;
  status: string;
  quizId: string;
  latitude: string;
  longitude: string;
}

const empty: JobFormValues = {
  title: '',
  description: '',
  requirements: '',
  benefits: '',
  quantity: '1',
  salaryMin: '',
  salaryMax: '',
  wardId: '',
  addressDetail: '',
  type: 'FULL_TIME',
  experience: '',
  level: '',
  deadline: '',
  categoryId: '',
  status: 'ACTIVE',
  quizId: '',
  latitude: '',
  longitude: '',
};

interface Meta {
  categories: { id: string; name: string }[];
  wards: { id: string; name: string }[];
}

export default function JobForm({
  initial,
  onSubmit,
  submitLabel,
  loading,
}: {
  initial?: Partial<JobFormValues>;
  onSubmit: (values: JobFormValues) => void;
  submitLabel: string;
  loading?: boolean;
}) {
  const [form, setForm] = useState<JobFormValues>({ ...empty, ...initial });
  const [meta, setMeta] = useState<Meta>({ categories: [], wards: [] });
  const [quizzes, setQuizzes] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    fetch('/api/employer/meta')
      .then(r => r.json())
      .then(d => setMeta({ categories: d.categories || [], wards: d.wards || [] }));

    fetch('/api/employer/quizzes')
      .then(r => r.json())
      .then(d => setQuizzes(d.quizzes || []));
  }, []);

  const [salaryAnalysis, setSalaryAnalysis] = useState<{
    predictedSalary: number;
    status: 'good' | 'average' | 'bad';
    percentageDiff: number;
    comparisonMessage: string;
  } | null>(null);

  useEffect(() => {
    const min = form.salaryMin;
    const max = form.salaryMax;
    if (!min && !max) {
      setTimeout(() => {
        setSalaryAnalysis(prev => prev === null ? null : null);
      }, 0);
      return;
    }

    const timer = setTimeout(() => {
      fetch('/api/public/salary/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience: form.experience,
          level: form.level,
          type: form.type,
          categoryId: form.categoryId,
          wardId: form.wardId,
          salaryMin: min,
          salaryMax: max,
        }),
      })
        .then(r => r.json())
        .then(d => {
          if (d && !d.error) {
            setSalaryAnalysis(d);
          }
        })
        .catch(err => console.error("Error analyzing salary:", err));
    }, 600);

    return () => clearTimeout(timer);
  }, [form.salaryMin, form.salaryMax, form.experience, form.level, form.type, form.categoryId, form.wardId]);

  const set = (k: keyof JobFormValues, v: string) => setForm(f => ({ ...f, [k]: v }));

  const inputCls =
    'w-full h-10 px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10';
  const textareaCls =
    'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none resize-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/10';

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-6 w-full"
    >
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-[#041b3c]">Thông tin cơ bản</h3>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Tiêu đề vị trí *</label>
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} required placeholder="VD: Lễ tân khách sạn 5 sao" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Ngành nghề *</label>
            <select className={inputCls} value={form.categoryId} onChange={e => set('categoryId', e.target.value)} required>
              <option value="">Chọn ngành</option>
              {meta.categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Số lượng tuyển</label>
            <input type="number" min={1} className={inputCls} value={form.quantity} onChange={e => set('quantity', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Mô tả công việc *</label>
          <textarea className={textareaCls} rows={5} value={form.description} onChange={e => set('description', e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Yêu cầu ứng viên</label>
          <textarea className={textareaCls} rows={4} value={form.requirements} onChange={e => set('requirements', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Quyền lợi</label>
          <textarea className={textareaCls} rows={3} value={form.benefits} onChange={e => set('benefits', e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-[#041b3c]">Lương & địa điểm</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Lương tối thiểu (VNĐ)</label>
            <input type="number" className={inputCls} value={form.salaryMin} onChange={e => set('salaryMin', e.target.value)} placeholder="VD: 10000000 (10 triệu)" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Lương tối đa (VNĐ)</label>
            <input type="number" className={inputCls} value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)} placeholder="VD: 20000000 (20 triệu)" />
          </div>
        </div>

        {salaryAnalysis && (
          <div className={`text-xs p-3 rounded-lg border transition-all duration-200 ${salaryAnalysis.status === 'bad'
            ? 'bg-[#FFF9E6] border-[#FFE599] text-[#805B00]'
            : salaryAnalysis.status === 'good'
              ? 'bg-[#E6F9F0] border-[#99E6C4] text-[#006633]'
              : 'bg-[#E6F0FF] border-[#99C2FF] text-[#004080]'
            }`}>
            <div className="flex items-start gap-2">
              <span className="text-sm">
                {salaryAnalysis.status === 'bad' ? '⚠️' : salaryAnalysis.status === 'good' ? '✨' : 'ℹ️'}
              </span>
              <div>
                <p className="font-semibold">Phân tích mức lương đề xuất:</p>
                <p className="mt-0.5">{salaryAnalysis.comparisonMessage}</p>
                <p className="mt-1 text-[10px] opacity-80">
                  Mức lương trung bình ước tính cho vị trí tương tự: <strong>{salaryAnalysis.predictedSalary} triệu VNĐ</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Khu vực</label>
            <select className={inputCls} value={form.wardId} onChange={e => set('wardId', e.target.value)}>
              <option value="">Chọn khu vực</option>
              {meta.wards.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Hạn nộp hồ sơ</label>
            <input type="date" className={inputCls} value={form.deadline} onChange={e => set('deadline', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Địa chỉ chi tiết</label>
          <input className={inputCls} value={form.addressDetail} onChange={e => set('addressDetail', e.target.value)} placeholder="Số nhà, đường..." />
        </div>
        <div className="pt-2">
          <label className="block text-xs font-semibold text-gray-500 mb-2">Định vị trên bản đồ (OpenStreetMap)</label>
          <JobMapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(lat, lng) => {
              setForm(f => ({ ...f, latitude: lat, longitude: lng }));
            }}
            addressDetail={form.addressDetail}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-[#041b3c]">Chi tiết thêm</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Hình thức</label>
            <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="FULL_TIME">Toàn thời gian</option>
              <option value="PART_TIME">Bán thời gian</option>
              <option value="CONTRACT">Hợp đồng</option>
              <option value="INTERNSHIP">Thực tập</option>
              <option value="REMOTE">Làm từ xa</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Trạng thái tin</label>
            <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="ACTIVE">Đang tuyển</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="CLOSED">Đã đóng</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Kinh nghiệm</label>
            <select className={inputCls} value={form.experience} onChange={e => set('experience', e.target.value)}>
              <option value="">Không yêu cầu</option>
              <option value="NO_EXPERIENCE">Không cần KN</option>
              <option value="UNDER_1_YEAR">Dưới 1 năm</option>
              <option value="ONE_TO_THREE_YEARS">1-3 năm</option>
              <option value="THREE_TO_FIVE_YEARS">3-5 năm</option>
              <option value="OVER_FIVE_YEARS">Trên 5 năm</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Cấp bậc</label>
            <select className={inputCls} value={form.level} onChange={e => set('level', e.target.value)}>
              <option value="">—</option>
              <option value="INTERN">Thực tập</option>
              <option value="FRESHER">Mới tốt nghiệp</option>
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid</option>
              <option value="SENIOR">Senior</option>
              <option value="LEAD">Lead</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Đính kèm bài kiểm tra năng lực (Quiz trắc nghiệm)</label>
            <select className={inputCls} value={form.quizId} onChange={e => set('quizId', e.target.value)}>
              <option value="">Không đính kèm bài kiểm tra</option>
              {quizzes.map(q => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">Ứng viên sẽ phải hoàn thành bài test này khi nộp đơn ứng tuyển.</p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-8 py-3 bg-[#0052CC] hover:bg-[#0040a2] text-white font-bold rounded-lg disabled:opacity-60 cursor-pointer"
      >
        {loading ? 'Đang lưu...' : submitLabel}
      </button>
    </form>
  );
}
