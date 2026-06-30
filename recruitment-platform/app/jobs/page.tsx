import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getFilteredJobs } from '@/lib/jobService';
import { formatSalary, getExperienceLabel, getJobTypeLabel, SALARY_OPTIONS, EXPERIENCE_OPTIONS, TYPE_OPTIONS, LEVEL_OPTIONS, SORT_OPTIONS } from '@/lib/jobLabels';
import JobSearchForm from '@/components/jobs/JobSearchForm';
import JobSidebarFilters from '@/components/jobs/JobSidebarFilters';
import CompaniesHot from '@/components/jobs/CompantiesHot';
import JobPagination from '@/components/jobs/JobPagination';
import JobList from '@/components/jobs/JobList';
import ActiveFilter from '@/components/jobs/ActiveFilter';
import JobResultHeader from '@/components/jobs/JobResultHeader';
import Breadcrumbs from '@/components/jobs/Breadcrumbs';

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

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const {
    jobs,
    total,
    categories,
    featuredCompanies,
    wards,
    isLoggedIn,
    savedJobs,
    appliedJobs,
    activeCompanyName,
    query,
    category,
    salary,
    type,
    location,
    experience,
    level,
    sort,
    companySlug,
    page,
    limit
  } = await getFilteredJobs(params, token);

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
        <Breadcrumbs query={query} category={category} getCategoryName={getCategoryName} />

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
            <CompaniesHot featuredCompanies={featuredCompanies} />
          </aside>

          {/* JOB LISTINGS CONTENT */}
          <div className="flex-1 min-w-0 pb-6">
            {/* Results header */}
            <JobResultHeader query={query} total={total} sort={sort} getSortFilterLink={getSortFilterLink} SORT_OPTIONS={SORT_OPTIONS} />

            {/* Active filter tags */}
            <ActiveFilter category={category} companySlug={companySlug} salary={salary} experience={experience} type={type} level={level} activeFilterCount={activeFilterCount} getCategoryName={getCategoryName} getFilterRemoveLink={getFilterRemoveLink} activeCompanyName={activeCompanyName} SALARY_OPTIONS={SALARY_OPTIONS} EXPERIENCE_OPTIONS={EXPERIENCE_OPTIONS} TYPE_OPTIONS={TYPE_OPTIONS} LEVEL_OPTIONS={LEVEL_OPTIONS} />

            {/* Jobs List Grid */}
            <JobList
              jobs={jobs}
              savedJobs={savedJobs}
              appliedJobs={appliedJobs}
              isLoggedIn={isLoggedIn}
              activeFilterCount={activeFilterCount}
              getClearFilterLink={getClearFilterLink}
              formatSalary={formatSalary}
              getJobTypeLabel={getJobTypeLabel}
              getExperienceLabel={getExperienceLabel}
            />

            {/* Pagination Controls */}
            <JobPagination totalPages={totalPages} page={page} getPageLink={getPageLink} />

          </div>
        </div>
      </div>
    </main>
  );
}