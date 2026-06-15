'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { jobs: number };
}

const SALARY_OPTIONS = [
  { label: 'Tất cả mức lương', value: '' },
  { label: 'Dưới 10 triệu', value: 'lt10' },
  { label: '10 - 15 triệu', value: '10to15' },
  { label: '15 - 20 triệu', value: '15to20' },
  { label: '20 - 25 triệu', value: '20to25' },
  { label: '25 - 30 triệu', value: '25to30' },
  { label: '30 - 50 triệu', value: '30to50' },
  { label: 'Trên 50 triệu', value: 'gt50' },
  { label: 'Thỏa thuận', value: 'negotiable' },
];

const EXPERIENCE_OPTIONS = [
  { label: 'Tất cả', value: '' },
  { label: 'Chưa có kinh nghiệm', value: 'NO_EXPERIENCE' },
  { label: 'Dưới 1 năm', value: 'UNDER_1_YEAR' },
  { label: '1 – 3 năm', value: 'ONE_TO_THREE_YEARS' },
  { label: '3 – 5 năm', value: 'THREE_TO_FIVE_YEARS' },
  { label: 'Trên 5 năm', value: 'OVER_FIVE_YEARS' },
];

const TYPE_OPTIONS = [
  { label: 'Tất cả', value: '' },
  { label: 'Toàn thời gian', value: 'FULL_TIME' },
  { label: 'Bán thời gian', value: 'PART_TIME' },
  { label: 'Hợp đồng', value: 'CONTRACT' },
  { label: 'Thực tập', value: 'INTERNSHIP' },
];

const LEVEL_OPTIONS = [
  { label: 'Tất cả', value: '' },
  { label: 'Intern / Thực tập sinh', value: 'INTERN' },
  { label: 'Fresher', value: 'FRESHER' },
  { label: 'Junior / Nhân viên', value: 'JUNIOR' },
  { label: 'Senior / Chuyên viên', value: 'SENIOR' },
  { label: 'Leader / Trưởng nhóm', value: 'LEADER' },
  { label: 'Manager / Quản lý', value: 'MANAGER' },
  { label: 'Director / Giám đốc', value: 'DIRECTOR' },
];

function SidebarSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3.5 px-4 text-[13px] font-semibold text-gray-800 hover:text-[#00b14f] transition-colors cursor-pointer select-none"
      >
        {title}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pb-3.5 px-4">{children}</div>}
    </div>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      {options.filter(o => o.value !== '').map(opt => (
        <label
          key={opt.value}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <span
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${value === opt.value
              ? 'border-[#00b14f] bg-[#00b14f]'
              : 'border-gray-300 group-hover:border-[#00b14f]'
              }`}
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
          >
            {value === opt.value && (
              <span className="w-1.5 h-1.5 rounded-full bg-white block" />
            )}
          </span>
          <span
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
            className={`text-[13px] leading-tight transition-colors ${value === opt.value ? 'text-[#00b14f] font-medium' : 'text-gray-600 group-hover:text-gray-900'
              }`}
          >
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );
}

interface JobSidebarFiltersProps {
  categories: Category[];
  activeCategory: string;
  activeSalary: string;
  activeExperience: string;
  activeType: string;
  activeLevel: string;
  activeFilterCount: number;
}

export default function JobSidebarFilters({
  categories,
  activeCategory,
  activeSalary,
  activeExperience,
  activeType,
  activeLevel,
  activeFilterCount
}: JobSidebarFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`/jobs?${params.toString()}`);
  };

  const clearAll = () => {
    const params = new URLSearchParams();
    const query = searchParams.get('query');
    const location = searchParams.get('location');
    if (query) params.set('query', query);
    if (location) params.set('location', location);
    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#00b14f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <span className="text-[13px] font-bold text-gray-800">Lọc nâng cao</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#00b14f] text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="text-[12px] text-red-500 hover:text-red-600 font-medium cursor-pointer transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Ngành nghề */}
      <SidebarSection title="Ngành nghề">
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
          {categories.map(c => (
            <label key={c.id} className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${activeCategory === c.slug
                    ? 'border-[#00b14f] bg-[#00b14f]'
                    : 'border-gray-300 group-hover:border-[#00b14f]'
                    }`}
                  onClick={() => setFilter('category', activeCategory === c.slug ? '' : c.slug)}
                >
                  {activeCategory === c.slug && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span
                  onClick={() => setFilter('category', activeCategory === c.slug ? '' : c.slug)}
                  className={`text-[13px] leading-tight ${activeCategory === c.slug ? 'text-[#00b14f] font-medium' : 'text-gray-600 group-hover:text-gray-900'
                    }`}
                >
                  {c.name}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                {c._count.jobs}
              </span>
            </label>
          ))}
        </div>
      </SidebarSection>

      {/* Mức lương */}
      <SidebarSection title="Mức lương">
        <RadioGroup
          options={SALARY_OPTIONS}
          value={activeSalary}
          onChange={v => setFilter('salary', v)}
        />
      </SidebarSection>

      {/* Kinh nghiệm */}
      <SidebarSection title="Kinh nghiệm">
        <RadioGroup
          options={EXPERIENCE_OPTIONS}
          value={activeExperience}
          onChange={v => setFilter('experience', v)}
        />
      </SidebarSection>

      {/* Hình thức làm việc */}
      <SidebarSection title="Hình thức làm việc">
        <RadioGroup
          options={TYPE_OPTIONS}
          value={activeType}
          onChange={v => setFilter('type', v)}
        />
      </SidebarSection>

      {/* Cấp bậc */}
      <SidebarSection title="Cấp bậc" defaultOpen={false}>
        <RadioGroup
          options={LEVEL_OPTIONS}
          value={activeLevel}
          onChange={v => setFilter('level', v)}
        />
      </SidebarSection>
    </div>
  );
}
