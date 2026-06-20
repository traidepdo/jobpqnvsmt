import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { JobStatus } from '@prisma/client';
import { companyCardSelect } from '@/lib/prismaSafe';
import { getLatestModel, predictSalary } from '@/lib/salaryPredictor';
import { verifyToken } from '@/lib/auth';
import { formatSalary, getExperienceLabel, getJobTypeLabel } from '@/lib/jobLabels';
import JobSearchForm from '@/components/jobs/JobSearchForm';
import JobSidebarFilters from '@/components/jobs/JobSidebarFilters';
import JobSaveButton from '@/components/jobs/JobSaveButton';

interface RouteParams {
  searchParams: Promise<{
    query?: string;
    category?: string;
    salary?: string;
    type?: string;
    location?: string;
    experience?: string;
    level?: string;
    sort?: string;
    page?: string;
    company?: string;
  }>;
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

const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Lương từ thấp đến Cao', value: 'minsalary' },
  { label: 'Lương từ Cao đến Thấp', value: 'maxsalary' },
];

function getSalaryMinCondition(operator: 'lte' | 'gte', value: number) {
  return {
    OR: [
      {
        AND: [
          { salaryMin: { [operator]: value / 1_000_000, not: null } },
          { salaryMin: { lt: 100_000 } }
        ]
      },
      {
        AND: [
          { salaryMin: { [operator]: value, not: null } },
          { salaryMin: { gte: 100_000 } }
        ]
      }
    ]
  };
}

function getSalaryMaxCondition(operator: 'lte' | 'gte', value: number) {
  return {
    OR: [
      {
        AND: [
          { salaryMax: { [operator]: value / 1_000_000, not: null } },
          { salaryMax: { lt: 100_000 } }
        ]
      },
      {
        AND: [
          { salaryMax: { [operator]: value, not: null } },
          { salaryMax: { gte: 100_000 } }
        ]
      }
    ]
  };
}

// ─── GENERATE METADATA FOR SEO ─────────────────────────────────────────────
export async function generateMetadata({ searchParams }: RouteParams) {
  const params = await searchParams;
  const query = params.query || '';
  const category = params.category || '';

  let title = 'Tìm việc làm tại Phú Quốc | Phú Quốc Jobs';
  let description = 'Danh sách việc làm mới nhất tại Phú Quốc. Tìm kiếm việc làm, nhà tuyển dụng uy tín và ứng tuyển trực tuyến nhanh chóng với Phú Quốc Jobs.';

  if (query) {
    title = `Tuyển dụng "${query}" tại Phú Quốc | Phú Quốc Jobs`;
    description = `Danh sách việc làm cho từ khóa "${query}" tại Phú Quốc mới nhất. Nhiều cơ hội việc làm hấp dẫn đang tuyển dụng trên Phú Quốc Jobs.`;
  } else if (category) {
    title = `Việc làm ngành ${category} tại Phú Quốc | Phú Quốc Jobs`;
    description = `Danh sách cơ hội việc làm ngành ${category} tại Phú Quốc. Mức lương cao, chế độ đãi ngộ tốt, cập nhật liên tục mỗi ngày.`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    }
  };
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default async function JobsPage({ searchParams }: RouteParams) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const limit = 12;
  const skip = (page - 1) * limit;

  const query = params.query?.trim() || '';
  const category = params.category?.trim() || '';
  const salary = params.salary?.trim() || '';
  const type = params.type?.trim() || '';
  const location = params.location?.trim() || '';
  const experience = params.experience?.trim() || '';
  const level = params.level?.trim() || '';
  const sort = params.sort?.trim() || 'newest';

  const andConditions: object[] = [];

  if (query) {
    andConditions.push({
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { company: { name: { contains: query, mode: 'insensitive' } } },
      ],
    });
  }

  if (location) {
    andConditions.push({
      OR: [
        { ward: { name: { contains: location, mode: 'insensitive' } } },
        { addressDetail: { contains: location, mode: 'insensitive' } },
      ],
    });
  }

  if (salary) {
    switch (salary) {
      case 'lt10':
        andConditions.push(getSalaryMaxCondition('lte', 10_000_000));
        break;
      case '10to15':
        andConditions.push({
          AND: [
            getSalaryMinCondition('gte', 10_000_000),
            getSalaryMinCondition('lte', 15_000_000)
          ]
        });
        break;
      case '15to20':
        andConditions.push({
          AND: [
            getSalaryMinCondition('gte', 15_000_000),
            getSalaryMinCondition('lte', 20_000_000)
          ]
        });
        break;
      case '20to25':
        andConditions.push({
          AND: [
            getSalaryMinCondition('gte', 20_000_000),
            getSalaryMinCondition('lte', 25_000_000)
          ]
        });
        break;
      case '25to30':
        andConditions.push({
          AND: [
            getSalaryMinCondition('gte', 25_000_000),
            getSalaryMinCondition('lte', 30_000_000)
          ]
        });
        break;
      case '30to50':
        andConditions.push({
          AND: [
            getSalaryMinCondition('gte', 30_000_000),
            getSalaryMinCondition('lte', 50_000_000)
          ]
        });
        break;
      case 'gt50':
        andConditions.push(getSalaryMinCondition('gte', 50_000_000));
        break;
      case 'negotiable':
        andConditions.push({ salaryMin: null, salaryMax: null });
        break;
    }
  }

  let orderBy = {};
  switch (sort) {
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'minsalary':
      orderBy = { salaryMin: { sort: 'asc', nulls: 'last' } };
      break;
    case 'maxsalary':
      orderBy = { salaryMin: { sort: 'desc', nulls: 'last' } };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  const companySlug = params.company?.trim() || '';

  let activeCompanyName = '';
  if (companySlug) {
    const comp = await prisma.company.findUnique({
      where: { slug: companySlug },
      select: { name: true }
    });
    if (comp) activeCompanyName = comp.name;
  }

  const where = {
    status: JobStatus.ACTIVE,
    ...(category && { category: { slug: category } }),
    ...(companySlug && { company: { slug: companySlug } }),
    ...(type && { type: type as never }),
    ...(experience && { experience: experience as never }),
    ...(level && { level: level as never }),
    ...(andConditions.length > 0 && { AND: andConditions }),
  };

  // Run DB Queries in parallel
  const [rawJobs, total, categories, topCompanies, wards] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        title: true,
        slug: true,
        salaryMin: true,
        salaryMax: true,
        type: true,
        experience: true,
        level: true,
        deadline: true,
        createdAt: true,
        categoryId: true,
        wardId: true,
        company: { select: companyCardSelect },
        category: { select: { name: true, slug: true } },
        ward: { select: { name: true } },
      },
    }),
    prisma.job.count({ where }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true, _count: { select: { jobs: { where: { status: JobStatus.ACTIVE } } } } },
      orderBy: { name: 'asc' },
    }),
    prisma.company.findMany({
      where: { isApproved: true, isActive: true },
      select: {
        name: true,
        logo: true,
        slug: true,
        jobs: {
          where: { status: JobStatus.ACTIVE },
          select: { id: true, appliesCount: true }
        }
      },
      take: 20 // Lấy nhiều hơn để lọc các công ty có ít nhất 1 job hoạt động
    }),
    prisma.ward.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
  ]);

  // Map & Sort các công ty hot nhất dựa trên tổng số lượt ứng tuyển của các job
  const featuredCompanies = topCompanies
    .map(c => {
      const totalApplies = c.jobs.reduce((sum, j) => sum + (j.appliesCount || 0), 0);
      return {
        name: c.name,
        logo: c.logo,
        slug: c.slug,
        totalApplies,
        jobCount: c.jobs.length
      };
    })
    .filter(c => c.jobCount > 0)
    .sort((a, b) => b.totalApplies - a.totalApplies)
    .slice(0, 6);

  // Apply AI Salary prediction analysis
  const model = await getLatestModel();
  const jobs = rawJobs.map(job => {
    const min = job.salaryMin;
    const max = job.salaryMax;

    let actualSalary: number | null = null;
    if (min !== null && max !== null) {
      actualSalary = (min + max) / 2;
    } else if (min !== null) {
      actualSalary = min;
    } else if (max !== null) {
      actualSalary = max;
    }

    let salaryStatus: 'good' | 'average' | 'bad' | null = null;
    let salaryDiff = 0;

    if (actualSalary !== null) {
      if (actualSalary > 100000) {
        actualSalary = actualSalary / 1000000;
      }

      const predicted = predictSalary({
        experience: job.experience,
        level: job.level,
        type: job.type,
        categoryId: job.categoryId,
        wardId: job.wardId,
      }, model);

      salaryDiff = Math.round(((actualSalary - predicted) / predicted) * 100);
      if (actualSalary >= 1.15 * predicted) {
        salaryStatus = 'good';
      } else if (actualSalary < 0.9 * predicted) {
        salaryStatus = 'bad';
      } else {
        salaryStatus = 'average';
      }
    }

    return {
      ...job,
      salaryStatus,
      salaryDiff
    };
  });

  // Verify auth state & retrieve candidate's saved / applied jobs directly
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const savedJobs = new Set<string>();
  const appliedJobs = new Set<string>();
  let isLoggedIn = false;

  if (token) {
    try {
      const payload = await verifyToken(token);
      if (payload && payload.role === 'CANDIDATE') {
        isLoggedIn = true;
        const [savedList, appliedList] = await Promise.all([
          prisma.savedJob.findMany({ where: { userId: payload.id as string }, select: { jobId: true } }),
          prisma.application.findMany({ where: { userId: payload.id as string }, select: { jobId: true } })
        ]);
        savedList.forEach(s => savedJobs.add(s.jobId));
        appliedList.forEach(a => appliedJobs.add(a.jobId));
      }
    } catch (e) {
      console.error("Error loading candidate auth data in jobs list:", e);
    }
  }

  const activeFilterCount = [category, type, salary, experience, level, companySlug].filter(Boolean).length;
  const totalPages = Math.ceil(total / limit) || 1;
  const getCategoryName = (v: string) => categories.find(c => c.slug === v)?.name || v;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phuquocjobs.vn';

  // Structured Data (JSON-LD) for SEO
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

  // Render filter clearing link builder
  const getClearFilterLink = () => {
    const q = [];
    if (query) q.push(`query=${encodeURIComponent(query)}`);
    if (location) q.push(`location=${encodeURIComponent(location)}`);
    return `/jobs${q.length ? '?' + q.join('&') : ''}`;
  };

  const getSortFilterLink = (sortVal: string) => {
    const q = [`sort=${sortVal}`];
    if (query) q.push(`query=${encodeURIComponent(query)}`);
    if (location) q.push(`location=${encodeURIComponent(location)}`);
    if (category) q.push(`category=${encodeURIComponent(category)}`);
    if (companySlug) q.push(`company=${encodeURIComponent(companySlug)}`);
    if (salary) q.push(`salary=${encodeURIComponent(salary)}`);
    if (type) q.push(`type=${encodeURIComponent(type)}`);
    if (experience) q.push(`experience=${encodeURIComponent(experience)}`);
    if (level) q.push(`level=${encodeURIComponent(level)}`);
    return `/jobs?${q.join('&')}`;
  };

  const getPageLink = (pageVal: number) => {
    const q = [`page=${pageVal}`];
    if (query) q.push(`query=${encodeURIComponent(query)}`);
    if (location) q.push(`location=${encodeURIComponent(location)}`);
    if (category) q.push(`category=${encodeURIComponent(category)}`);
    if (companySlug) q.push(`company=${encodeURIComponent(companySlug)}`);
    if (salary) q.push(`salary=${encodeURIComponent(salary)}`);
    if (type) q.push(`type=${encodeURIComponent(type)}`);
    if (experience) q.push(`experience=${encodeURIComponent(experience)}`);
    if (level) q.push(`level=${encodeURIComponent(level)}`);
    if (sort) q.push(`sort=${encodeURIComponent(sort)}`);
    return `/jobs?${q.join('&')}`;
  };

  const getFilterRemoveLink = (filterType: 'category' | 'salary' | 'experience' | 'type' | 'level' | 'company') => {
    const q = [`sort=${sort}`];
    if (query) q.push(`query=${encodeURIComponent(query)}`);
    if (location) q.push(`location=${encodeURIComponent(location)}`);
    if (category && filterType !== 'category') q.push(`category=${encodeURIComponent(category)}`);
    if (companySlug && filterType !== 'company') q.push(`company=${encodeURIComponent(companySlug)}`);
    if (salary && filterType !== 'salary') q.push(`salary=${encodeURIComponent(salary)}`);
    if (type && filterType !== 'type') q.push(`type=${encodeURIComponent(type)}`);
    if (experience && filterType !== 'experience') q.push(`experience=${encodeURIComponent(experience)}`);
    if (level && filterType !== 'level') q.push(`level=${encodeURIComponent(level)}`);
    return `/jobs?${q.join('&')}`;
  };

  return (
    <main className="min-h-screen bg-[#f4f6f5] pt-[60px] pb-16">
      {/* SEO Structured Data */}
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

      {/* Search form component */}
      <JobSearchForm initialQuery={query} initialLocation={location} wards={wards} />

      {/* Main Layout Grid */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 mt-5">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-[13px] text-gray-500 mb-4 flex-wrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-[#00b14f] transition-colors">Trang chủ</Link>
          <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/jobs" className={`hover:text-[#00b14f] transition-colors ${!query && !category ? 'text-[#00b14f] font-medium pointer-events-none' : ''}`}>
            Việc làm Phú Quốc
          </Link>
          {category && (
            <>
              <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-[#00b14f] font-medium">{getCategoryName(category)}</span>
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

        <div className="flex gap-5 items-start">
          {/* LEFT SIDEBAR FILTERS */}
          <aside className="w-[260px] flex-shrink-0 pb-6 sticky top-[143px] hidden lg:block" style={{ maxHeight: 'calc(100vh - 158px)', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>
            <JobSidebarFilters
              categories={categories}
              activeCategory={category}
              activeSalary={salary}
              activeExperience={experience}
              activeType={type}
              activeLevel={level}
              activeFilterCount={activeFilterCount}
            />

            {/* FEATURED COMPANIES (HOT COMPANIES BY APPLICATIONS COUNT) */}
            {featuredCompanies.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mt-4">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-gray-800">Công ty Hot</h3>
                  <Link href="/companies" className="text-[12px] text-[#00b14f] hover:underline font-medium">
                    Xem tất cả
                  </Link>
                </div>
                <div className="p-3 space-y-2">
                  {featuredCompanies.map(c => (
                    <Link
                      key={c.slug}
                      href={`/jobs?company=${c.slug}`}
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
                        <p className="text-[11px] text-gray-400 font-semibold">{c.totalApplies} lượt ứng tuyển</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* JOB LISTINGS CONTENT */}
          <div className="flex-1 min-w-0 pb-6">
            {/* Results header */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {query ? `Kết quả cho "${query}"` : 'Việc làm Phú Quốc'}
                </h1>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  {total.toLocaleString()} việc làm phù hợp
                </p>
              </div>

              {/* Sắp xếp */}
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-gray-500">Sắp xếp:</span>
                <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {SORT_OPTIONS.map(s => (
                    <Link
                      key={s.value}
                      href={getSortFilterLink(s.value)}
                      className={`px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${sort === s.value ? 'bg-[#00b14f] text-white' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {s.label}
                    </Link>
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
                    <Link href={getFilterRemoveLink('category')} className="hover:text-red-500 cursor-pointer">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Link>
                  </span>
                )}
                {companySlug && activeCompanyName && (
                  <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                    Công ty: {activeCompanyName}
                    <Link href={getFilterRemoveLink('company')} className="hover:text-red-500 cursor-pointer">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Link>
                  </span>
                )}
                {salary && (
                  <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                    {SALARY_OPTIONS.find(o => o.value === salary)?.label}
                    <Link href={getFilterRemoveLink('salary')} className="hover:text-red-500 cursor-pointer">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Link>
                  </span>
                )}
                {experience && (
                  <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                    {EXPERIENCE_OPTIONS.find(o => o.value === experience)?.label}
                    <Link href={getFilterRemoveLink('experience')} className="hover:text-red-500 cursor-pointer">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Link>
                  </span>
                )}
                {type && (
                  <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                    {TYPE_OPTIONS.find(o => o.value === type)?.label}
                    <Link href={getFilterRemoveLink('type')} className="hover:text-red-500 cursor-pointer">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Link>
                  </span>
                )}
                {level && (
                  <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                    {LEVEL_OPTIONS.find(o => o.value === level)?.label}
                    <Link href={getFilterRemoveLink('level')} className="hover:text-red-500 cursor-pointer">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Link>
                  </span>
                )}
              </div>
            )}

            {/* Jobs List Grid */}
            {jobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-700 text-lg mb-1">Không tìm thấy việc làm phù hợp</p>
                <p className="text-sm text-gray-400 mb-5">Thử thay đổi từ khóa hoặc xóa bớt bộ lọc</p>
                {activeFilterCount > 0 && (
                  <Link href={getClearFilterLink()}
                    className="inline-flex items-center gap-1.5 bg-[#00b14f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg cursor-pointer hover:bg-[#009940] transition-colors">
                    Xóa bộ lọc
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {jobs.map(job => {
                  const saved = savedJobs.has(job.id);
                  return (
                    <article key={job.id}
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
                              {appliedJobs.has(job.id) && (
                                <span className="flex-shrink-0 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded mt-0.5">
                                  Đã ứng tuyển
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
                                <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${job.salaryStatus === 'good'
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

                      {/* Save button (client interaction) */}
                      <JobSaveButton
                        jobId={job.id}
                        initialSaved={saved}
                        isLoggedIn={isLoggedIn}
                      />
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className="flex justify-center items-center gap-1.5 mt-8" aria-label="Phân trang việc làm">
                <Link
                  href={getPageLink(page - 1)}
                  className={`w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-[#00b14f] hover:text-[#00b14f] ${page === 1 ? 'pointer-events-none opacity-30 bg-gray-50' : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>

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
                      <Link
                        key={p}
                        href={getPageLink(p as number)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors ${p === page ? 'bg-[#00b14f] text-white shadow-sm shadow-green-200' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#00b14f] hover:text-[#00b14f]'}`}
                      >
                        {p}
                      </Link>
                    )
                  )}

                <Link
                  href={getPageLink(page + 1)}
                  className={`w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-[#00b14f] hover:text-[#00b14f] ${page === totalPages ? 'pointer-events-none opacity-30 bg-gray-50' : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </nav>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}