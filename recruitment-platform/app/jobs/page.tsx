import React, { Suspense } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getJobsLayoutData, getJobsListData } from '@/lib/jobService';
import { formatSalary, getExperienceLabel, getJobTypeLabel, SALARY_OPTIONS, EXPERIENCE_OPTIONS, TYPE_OPTIONS, LEVEL_OPTIONS, SORT_OPTIONS } from '@/lib/jobLabels';
import JobSearchForm from '@/components/jobs/JobSearchForm';
import JobSidebarFilters from '@/components/jobs/JobSidebarFilters';
import CompaniesHot from '@/components/jobs/CompantiesHot';
import JobPagination from '@/components/jobs/JobPagination';
import JobList from '@/components/jobs/JobList';
import ActiveFilter from '@/components/jobs/ActiveFilter';
import JobResultHeader from '@/components/jobs/JobResultHeader';
import Breadcrumbs from '@/components/jobs/Breadcrumbs';
import JobCompany from '@/components/jobs/JobCompany';
import useDetailsJob from '@/lib/hooks/useDetailsJob';
import { JobsLoadingProvider } from '@/components/jobs/JobsLoadingContext';
import JobListWrapper from '@/components/jobs/JobListWrapper';

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
    featured?: string;
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

  const { categories, featuredCompanies, wards } = await getJobsLayoutData();

  const query = params.query || '';
  const category = params.category || '';
  const salary = params.salary || '';
  const type = params.type || '';
  const location = params.location || '';
  const experience = params.experience || '';
  const level = params.level || '';
  const sort = params.sort || 'newest';
  const companySlug = params.company || '';
  const page = params.page || '1';
  const featured = params.featured || '';

  const activeFilterCount = [category, type, salary, experience, level, companySlug].filter(Boolean).length;
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

  return (
    <JobsLoadingProvider>
      <main className="min-h-screen bg-slate-50 pt-[60px] pb-16">
        {/* SEO Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />

        {/* Search form component */}
        <JobSearchForm initialQuery={query} initialLocation={location} wards={wards} />

        {/* Main Layout Grid */}
        <div className="max-w-[1300px] mx-auto px-4 md:px-8 mt-5">
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
              <JobListWrapper fallback={<JobCardsSkeleton />}>
                <Suspense fallback={<JobCardsSkeleton />}>
                  <JobListSection
                    searchParams={params}
                    token={token}
                    categories={categories}
                    getCategoryName={getCategoryName}
                    baseUrl={baseUrl}
                  />
                </Suspense>
              </JobListWrapper>
            </div>
          </div>
        </div>
      </main>
    </JobsLoadingProvider>
  );
}

// ─── JOBS LIST LOADER COMPONENT (SUSPENSED) ──────────────────────────────────
interface JobListSectionProps {
  searchParams: any;
  token?: string;
  categories: { id: string; name: string; slug: string }[];
  getCategoryName: (v: string) => string;
  baseUrl: string;
}

async function JobListSection({ searchParams, token, categories, getCategoryName, baseUrl }: JobListSectionProps) {
  const {
    jobs,
    total,
    isLoggedIn,
    savedJobs,
    appliedJobs,
    activeCompanyName,
    matchedCompanies,
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
    limit,
    featured,
  } = await getJobsListData(searchParams, token);

  const activeFilterCount = [category, type, salary, experience, level, companySlug].filter(Boolean).length;
  const totalPages = Math.ceil(total / limit) || 1;

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

  const { getClearFilterLink, getSortFilterLink, getPageLink, getFilterRemoveLink } = useDetailsJob({ query, location, category, companySlug, salary, type, experience, level, sort, featured });

  return (
    <>
      {jobListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobListSchema) }}
        />
      )}

      {/* Results header */}
      <JobResultHeader query={query} total={total} sort={sort} getSortFilterLink={getSortFilterLink} SORT_OPTIONS={SORT_OPTIONS} />

      {/* Active filter tags */}
      <ActiveFilter category={category} companySlug={companySlug} salary={salary} experience={experience} type={type} level={level} activeFilterCount={activeFilterCount} getCategoryName={getCategoryName} getFilterRemoveLink={getFilterRemoveLink} activeCompanyName={activeCompanyName} SALARY_OPTIONS={SALARY_OPTIONS} EXPERIENCE_OPTIONS={EXPERIENCE_OPTIONS} TYPE_OPTIONS={TYPE_OPTIONS} LEVEL_OPTIONS={LEVEL_OPTIONS} />

      {/* MATCHED COMPANIES AT THE TOP */}
      <JobCompany matchedCompanies={matchedCompanies} />

      {/* Jobs List Grid */}
      <JobList
        jobs={jobs as any}
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
    </>
  );
}

// ─── SKELETON COMPONENT ───────────────────────────────────────────────────────
function JobCardsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex justify-between items-center bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-48" />
        <div className="h-9 bg-slate-100 rounded-lg w-36" />
      </div>

      <div className="space-y-3.5 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 flex gap-4">
            <div className="w-24 h-24 bg-slate-100 rounded-lg flex-shrink-0 m-5 animate-pulse" />
            <div className="flex-1 space-y-3 py-2">
              <div className="space-y-2">
                <div className="h-5 bg-slate-250 rounded w-1/2" />
                <div className="h-4 bg-slate-200 rounded w-1/4" />
              </div>
              <div className="flex gap-2 flex-wrap pt-2">
                <div className="h-6 bg-slate-100 rounded-lg w-20" />
                <div className="h-6 bg-slate-100 rounded-lg w-24" />
                <div className="h-6 bg-slate-100 rounded-lg w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}