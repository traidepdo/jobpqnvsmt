'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { formatSalary, getExperienceLabel, getJobTypeLabel } from '@/lib/jobLabels';

interface JobItem {
  id: string;
  title: string;
  slug: string;
  salaryMin: number | null;
  salaryMax: number | null;
  type: string;
  experience: string | null;
  deadline: string | null;
  company: { name: string; logo: string | null; slug: string };
  category: { name: string; slug: string };
  ward: { name: string } | null;
  salaryStatus?: 'good' | 'average' | 'bad' | null;
  salaryDiff?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { jobs: number };
}

// ─── Filter options ───────────────────────────────────────────────────────

const SALARY_OPTIONS = [
  { label: 'Tất cả mức lương', value: '' },
  { label: 'Dưới 5 triệu', value: 'lt5' },
  { label: 'Trên 5 triệu', value: 'to5' },
  { label: 'Trên 10', value: 'to10' },
  { label: 'Trên 20', value: 'to20' },
  { label: 'Trên 30', value: 'to30' },
  { label: 'Trên 40', value: 'to40' },
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

const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Lương từ thấp đến Cao', value: 'minsalary' },
  { label: 'Lương từ Cao đến Thấp', value: 'maxsalary' },
];

// ─── Sidebar accordion section ────────────────────────────────────────────

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

// ─── Radio group for sidebar ──────────────────────────────────────────────

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

// ─── Breadcrumb ───────────────────────────────────────────────────────────

function Breadcrumb({ query, category, categoryName }: {
  query?: string;
  category?: string;
  categoryName?: string;
}) {
  return (
    <nav className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-4 flex-wrap">
      <Link href="/" className="hover:text-[#00b14f] transition-colors">Trang chủ</Link>
      <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <Link href="/jobs" className={`hover:text-[#00b14f] transition-colors ${!query && !category ? 'text-[#00b14f] font-medium pointer-events-none' : ''}`}>
        Việc làm Phú Quốc
      </Link>
      {category && categoryName && (
        <>
          <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#00b14f] font-medium">{categoryName}</span>
        </>
      )}
      {query && (
        <>
          <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#00b14f] font-medium">Tìm &quot;{query}&quot;</span>
        </>
      )}
    </nav>
  );
}

// ─── Featured companies widget ────────────────────────────────────────────

function FeaturedCompanies({ companies }: {
  companies: { name: string; logo: string | null; slug: string; jobCount?: number }[];
}) {
  if (!companies.length) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-gray-800">Công ty nổi bật</h3>
        <Link href="/companies" className="text-[12px] text-[#00b14f] hover:underline font-medium">
          Xem tất cả
        </Link>
      </div>
      <div className="p-3 space-y-2">
        {companies.map(c => (
          <Link
            key={c.slug}
            href={`/companies/${c.slug}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {c.logo ? (
                <img src={c.logo} alt={c.name} className="w-full h-full object-contain p-0.5" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#00b14f]/10 to-[#00b14f]/20 flex items-center justify-center">
                  <span className="text-[#00b14f] font-bold text-sm">{c.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-gray-800 group-hover:text-[#00b14f] transition-colors line-clamp-1">{c.name}</p>
              {c.jobCount !== undefined && (
                <p className="text-[11px] text-gray-400">{c.jobCount} việc làm</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════

function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

  const sort = searchParams.get('sort') || 'newest';
  const query = searchParams.get('query') || '';
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';
  const location = searchParams.get('location') || '';
  const salary = searchParams.get('salary') || '';
  const experience = searchParams.get('experience') || '';
  const level = searchParams.get('level') || '';

  const [test, setTest] = useState<JobItem[]>([]);


  const [searchInput, setSearchInput] = useState(query);
  const [locationInput, setLocationInput] = useState(location);

  const activeFilterCount = [category, type, salary, experience, level].filter(Boolean).length;
  const fetchJobs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      if (category) params.set('category', category);
      if (type) params.set('type', type);
      if (location) params.set('location', location);
      if (salary) params.set('salary', salary);
      if (experience) params.set('experience', experience);
      if (level) params.set('level', level);
      params.set('page', String(p));
      params.set('sort', sort);

      const res = await fetch(`/api/public/jobs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setCategories(data.categories || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query, category, type, location, salary, experience, level, sort]);

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  useEffect(() => {
    let titleStr = 'Tìm việc làm tại Phú Quốc | Phú Quốc Jobs';
    let descStr = 'Danh sách việc làm mới nhất tại Phú Quốc. Tìm kiếm việc làm, nhà tuyển dụng uy tín và ứng tuyển trực tuyến nhanh chóng với Phú Quốc Jobs.';

    if (query) {
      titleStr = `Tuyển dụng "${query}" tại Phú Quốc | Phú Quốc Jobs`;
      descStr = `Danh sách việc làm cho từ khóa "${query}" tại Phú Quốc mới nhất. Nhiều cơ hội việc làm hấp dẫn đang tuyển dụng trên Phú Quốc Jobs.`;
    } else if (category) {
      const catName = getCategoryName(category);
      titleStr = `Việc làm ${catName} tại Phú Quốc | Phú Quốc Jobs`;
      descStr = `Danh sách cơ hội việc làm ngành ${catName} tại Phú Quốc. Mức lương cao, chế độ đãi ngộ tốt, cập nhật liên tục mỗi ngày.`;
    }

    document.title = titleStr;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', descStr);
  }, [query, category, categories]);

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput) params.set('query', searchInput);
    else params.delete('query');
    if (locationInput) params.set('location', locationInput);
    else params.delete('location');
    router.push(`/jobs?${params.toString()}`);
  };

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/jobs?${params.toString()}`);
  };

  const clearAll = () => {
    const params = new URLSearchParams();
    if (searchInput) params.set('query', searchInput);
    if (locationInput) params.set('location', locationInput);
    router.push(`/jobs?${params.toString()}`);
  };

  const toggleSave = (id: string) => {
    setSavedJobs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const totalPages = Math.ceil(total / 12) || 1;
  const getCategoryName = (v: string) => categories.find(c => c.slug === v)?.name || v;

  const featuredCompanies = jobs
    .map(j => j.company)
    .filter((c, i, arr) => arr.findIndex(x => x.slug === c.slug) === i)
    .slice(0, 6)
    .map(c => ({ ...c, jobCount: jobs.filter(j => j.company.slug === c.slug).length }));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phuquocjobs.vn';

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Trang chủ',
        'item': baseUrl,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Việc làm Phú Quốc',
        'item': `${baseUrl}/jobs`,
      },
      ...(category ? [{
        '@type': 'ListItem',
        'position': 3,
        'name': getCategoryName(category),
        'item': `${baseUrl}/jobs?category=${encodeURIComponent(category)}`,
      }] : [])
    ]
  };

  const jobListSchema = jobs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Danh sách việc làm Phú Quốc',
    'itemListElement': jobs.map((job, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'url': `${baseUrl}/jobs/${job.slug}`,
      'name': job.title,
    }))
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {jobListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobListSchema) }}
        />
      )}
      <div className="min-h-screen bg-[#f4f6f5] pt-[60px] pb-16">

      {/* ── Search bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-[0_1px_0_rgba(0,0,0,0.04)] sticky top-[60px] z-40">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-4">
          <form onSubmit={applySearch}>
            <div className="flex gap-2.5">
              <div className="flex-1 relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Tên công việc, vị trí, kỹ năng..."
                  className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/10 transition bg-white"
                />
              </div>
              <div className="w-[220px] relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  value={locationInput}
                  onChange={e => setLocationInput(e.target.value)}
                  placeholder="Khu vực Phú Quốc"
                  className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/10 transition bg-white"
                />
              </div>
              <button
                type="submit"
                className="h-11 px-7 bg-[#00b14f] hover:bg-[#009940] active:scale-95 text-white font-bold text-[14px] rounded-xl transition-all cursor-pointer shadow-sm shadow-green-200 whitespace-nowrap"
              >
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 mt-5">

        {/* Breadcrumb */}
        <Breadcrumb
          query={query}
          category={category}
          categoryName={getCategoryName(category)}
        />

        <div className="flex gap-5 items-start">

          {/* ══ LEFT SIDEBAR ══════════════════════════════════════════════ */}
          <aside className="w-[260px] flex-shrink-0 pb-6 sticky top-[143px]" style={{ maxHeight: 'calc(100vh - 158px)', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>

            {/* Filter panel */}
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
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${category === c.slug
                            ? 'border-[#00b14f] bg-[#00b14f]'
                            : 'border-gray-300 group-hover:border-[#00b14f]'
                            }`}
                          onClick={() => setFilter('category', category === c.slug ? '' : c.slug)}
                        >
                          {category === c.slug && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span
                          onClick={() => setFilter('category', category === c.slug ? '' : c.slug)}
                          className={`text-[13px] leading-tight ${category === c.slug ? 'text-[#00b14f] font-medium' : 'text-gray-600 group-hover:text-gray-900'
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
                  value={salary}
                  onChange={v => setFilter('salary', v)}
                />
              </SidebarSection>

              {/* Kinh nghiệm */}
              <SidebarSection title="Kinh nghiệm">
                <RadioGroup
                  options={EXPERIENCE_OPTIONS}
                  value={experience}
                  onChange={v => setFilter('experience', v)}
                />
              </SidebarSection>

              {/* Hình thức làm việc */}
              <SidebarSection title="Hình thức làm việc">
                <RadioGroup
                  options={TYPE_OPTIONS}
                  value={type}
                  onChange={v => setFilter('type', v)}
                />
              </SidebarSection>

              {/* Cấp bậc */}
              <SidebarSection title="Cấp bậc" defaultOpen={false}>
                <RadioGroup
                  options={LEVEL_OPTIONS}
                  value={level}
                  onChange={v => setFilter('level', v)}
                />
              </SidebarSection>
            </div>

            {/* Featured companies */}
            <FeaturedCompanies companies={featuredCompanies} />

          </aside>

          {/* ══ JOB LIST ══════════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 pb-6">

            {/* Result header */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {query ? `Kết quả cho "${query}"` : 'Việc làm Phú Quốc'}
                </h1>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  {loading ? 'Đang tải...' : `${total.toLocaleString()} việc làm phù hợp`}
                </p>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-gray-500">Sắp xếp:</span>
                <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {SORT_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('sort', s.value);
                        router.push(`/jobs?${params}`);
                      }}
                      className={`px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${sort === s.value ? 'bg-[#00b14f] text-white' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active filter tags */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {category && (
                  <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                    {getCategoryName(category)}
                    <button onClick={() => setFilter('category', '')} className="hover:text-red-500 cursor-pointer">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                )}
                {salary && (
                  <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                    {SALARY_OPTIONS.find(o => o.value === salary)?.label}
                    <button onClick={() => setFilter('salary', '')} className="hover:text-red-500 cursor-pointer">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                )}
                {experience && (
                  <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                    {EXPERIENCE_OPTIONS.find(o => o.value === experience)?.label}
                    <button onClick={() => setFilter('experience', '')} className="hover:text-red-500 cursor-pointer">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                )}
                {type && (
                  <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                    {TYPE_OPTIONS.find(o => o.value === type)?.label}
                    <button onClick={() => setFilter('type', '')} className="hover:text-red-500 cursor-pointer">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                )}
                {level && (
                  <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                    {LEVEL_OPTIONS.find(o => o.value === level)?.label}
                    <button onClick={() => setFilter('level', '')} className="hover:text-red-500 cursor-pointer">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Job list */}
            {loading ? (
              <div className="flex flex-col items-center py-24 gap-3">
                <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Đang tải việc làm...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-700 text-lg mb-1">Không tìm thấy việc làm phù hợp</p>
                <p className="text-sm text-gray-400 mb-5">Thử thay đổi từ khóa hoặc xóa bớt bộ lọc</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearAll}
                    className="inline-flex items-center gap-1.5 bg-[#00b14f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg cursor-pointer hover:bg-[#009940] transition-colors">
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {jobs.map(job => {
                  const saved = savedJobs.has(job.id);
                  const isNew = job.deadline && new Date(job.deadline) > new Date();
                  return (
                    <div key={job.id}
                      className="bg-white rounded-xl border border-gray-100 hover:border-[#00b14f]/40 hover:shadow-md transition-all group relative">
                      <Link href={`/jobs/${job.slug}`} className="block p-4">
                        <div className="flex gap-3.5">
                          {/* Logo */}
                          <div className="w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {job.company.logo ? (
                              <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-contain p-1" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#00b14f]/10 to-[#00b14f]/20 flex items-center justify-center">
                                <span className="text-[#00b14f] font-bold text-lg">{job.company.name.charAt(0)}</span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 pr-8">
                            <div className="flex items-start gap-2 mb-0.5">
                              <h2 className="text-[14px] font-bold text-gray-900 group-hover:text-[#00b14f] transition-colors line-clamp-1">
                                {job.title}
                              </h2>
                              {isNew && (
                                <span className="flex-shrink-0 text-[10px] font-bold bg-orange-50 text-orange-500 border border-orange-200 px-1.5 py-0.5 rounded mt-0.5">
                                  HOT
                                </span>
                              )}
                            </div>

                            <p className="text-[12px] font-medium text-[#00b14f] mb-2 line-clamp-1">
                              {job.company.name}
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatSalary(job.salaryMin, job.salaryMax)}
                              </span>

                              {job.salaryStatus && (
                                <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                                  job.salaryStatus === 'good'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : job.salaryStatus === 'bad'
                                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                                      : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                }`}>
                                  <span>{job.salaryStatus === 'good' ? '✨' : job.salaryStatus === 'bad' ? '⚠️' : 'ℹ️'}</span>
                                  <span>
                                    {job.salaryStatus === 'good'
                                      ? `Lương tốt (+${Math.abs(job.salaryDiff || 0)}%)`
                                      : job.salaryStatus === 'bad'
                                        ? `Lương thấp (-${Math.abs(job.salaryDiff || 0)}%)`
                                        : 'Lương cạnh tranh'}
                                  </span>
                                </span>
                              )}

                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {job.ward?.name || 'Phú Quốc'}
                              </span>

                              <span className="inline-flex text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                                {getJobTypeLabel(job.type)}
                              </span>

                              {job.experience && (
                                <span className="inline-flex text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                                  {getExperienceLabel(job.experience)}
                                </span>
                              )}

                              <span className="inline-flex text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-100 px-2 py-0.5 rounded-md">
                                {job.category.name}
                              </span>
                            </div>

                            {job.deadline && (
                              <p className="text-[11px] text-gray-400 mt-1.5">
                                Hạn nộp: {new Date(job.deadline).toLocaleDateString('vi-VN')}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Save button */}
                      <button
                        onClick={() => toggleSave(job.id)}
                        className={`absolute top-3.5 right-3.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${saved ? 'text-[#00b14f] bg-[#00b14f]/10' : 'text-gray-300 hover:text-[#00b14f] hover:bg-[#00b14f]/10'
                          }`}
                        title={saved ? 'Bỏ lưu' : 'Lưu việc làm'}
                      >
                        <svg className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 mt-8">
                <button
                  onClick={() => fetchJobs(page - 1)}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-[#00b14f] hover:text-[#00b14f] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`e-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => fetchJobs(p as number)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${p === page ? 'bg-[#00b14f] text-white shadow-sm shadow-green-200' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#00b14f] hover:text-[#00b14f]'
                          }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => fetchJobs(page + 1)}
                  disabled={page === totalPages}
                  className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-[#00b14f] hover:text-[#00b14f] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

          </div>
          {/* ══ END JOB LIST ══════════════════════════════════════════════ */}

        </div>
      </div>
    </div>
    </>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
      </div>
    }>
      <JobsPageContent />
    </Suspense>
  );
}