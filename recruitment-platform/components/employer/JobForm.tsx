'use client';

import { useEffect, useState } from 'react';

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

  useEffect(() => {
    fetch('/api/employer/meta')
      .then(r => r.json())
      .then(d => setMeta({ categories: d.categories || [], wards: d.wards || [] }));
  }, []);

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
      className="space-y-6 max-w-3xl"
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
            <label className="block text-xs font-semibold text-gray-500 mb-1">Lương tối thiểu (triệu)</label>
            <input type="number" className={inputCls} value={form.salaryMin} onChange={e => set('salaryMin', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Lương tối đa (triệu)</label>
            <input type="number" className={inputCls} value={form.salaryMax} onChange={e => set('salaryMax', e.target.value)} />
          </div>
        </div>
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
