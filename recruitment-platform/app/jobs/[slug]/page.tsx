import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getLatestModel, predictSalary } from '@/lib/salaryPredictor';
import JobDetailsClient from '@/components/jobs/JobDetailsClient';
import { cache } from 'react';
interface PageProps {
  params: Promise<{ slug: string }>;
}
interface JobResponse {
  title: string;
  description: string;
}
const getdatametadata = cache(async (slug: string): Promise<JobResponse> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const data = await fetch(`${baseUrl}/api/public/jobs/metadata/${slug}`);
  if (!data.ok) {
    return { title: "Không tìm thấy công việc | Phú Quốc Jobs", description: "Công việc này đã đóng hoặc không tồn tại." };
  }
  const jobResponse: JobResponse = await data.json();
  return jobResponse;
})
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const jobResponse = await getdatametadata(slug);

  if (!jobResponse.title) {
    return {
      title: 'Không tìm thấy công việc | Phú Quốc Jobs',
      description: 'Công việc này đã đóng hoặc không tồn tại.'
    };
  }

  const title = jobResponse.title;
  const description = jobResponse.description;

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

const dataJob = cache(async (slug: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const data = await fetch(`${baseUrl}/api/public/jobs/${slug}`);
  if (!data.ok) {
    return null;
  }
  const jobData = await data.json();
  return jobData;
})

interface RelatedJob {
  id: string;
  title: string;
  slug: string;
  [key: string]: unknown;
}

const getRelatedJobs = cache(async (slug: string): Promise<RelatedJob[]> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const data = await fetch(`${baseUrl}/api/public/jobs/${slug}/recommend`);
    if (!data.ok) {
      return [];
    }
    const relatedJobs = await data.json() as RelatedJob[];
    return relatedJobs;
  } catch (err) {
    console.error("Error fetching related jobs from API route:", err);
    return [];
  }
})

const getJobState = cache(async (slug: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const cookieStore = await cookies();
  const data = await fetch(`${baseUrl}/api/public/jobs/${slug}/state`, {
    headers: {
      cookie: cookieStore.toString(),
    },
  });
  if (!data.ok) {
    return null;
  }
  const jobState = await data.json();
  return jobState;
})


export default async function JobViewPage({ params }: PageProps) {
  const { slug } = await params;

  const job = await dataJob(slug);

  if (!job) {
    notFound();
  }

  let userResumes: { id: string; title: string }[] = [];
  let initialSaved = false;
  let initialApplications: { id: string; jobId: string; status: string }[] = [];
  let user = null;
  let isAuthenticated = false;

  const jobState = await getJobState(slug);
  if (jobState) {
    userResumes = jobState.resumes;
    initialSaved = jobState.savedJobRecord;
    initialApplications = jobState.applications;
    user = jobState.user;
    isAuthenticated = jobState.isAuthenticated;
  }

  // 3. Compute Salary Analysis directly on the server
  let salaryAnalysis = null;
  try {
    const model = await getLatestModel();
    const predictedSalary = predictSalary({
      experience: job.experience,
      level: job.level,
      type: job.type,
      categoryId: job.categoryId,
      wardId: job.wardId
    }, model);

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

    let status: 'good' | 'average' | 'bad' = 'average';
    let percentageDiff = 0;
    let comparisonMessage = 'Mức lương cạnh tranh, tương đương với mặt bằng chung thị trường.';

    if (actualSalary !== null) {
      let actualSalaryScaled = actualSalary;
      if (actualSalaryScaled > 100000) {
        actualSalaryScaled = actualSalaryScaled / 1000000;
      }
      percentageDiff = Math.round(((actualSalaryScaled - predictedSalary) / predictedSalary) * 100);

      if (actualSalaryScaled >= 1.15 * predictedSalary) {
        status = 'good';
        comparisonMessage = `Mức lương này rất tốt so với thị trường (Cao hơn khoảng ${Math.abs(percentageDiff)}% so với vị trí tương tự).`;
      } else if (actualSalaryScaled < 0.9 * predictedSalary) {
        status = 'bad';
        comparisonMessage = `Mức lương này thấp hơn mức trung bình của thị trường (Thấp hơn khoảng ${Math.abs(percentageDiff)}% so với vị trí tương tự).`;
      } else {
        status = 'average';
        comparisonMessage = `Mức lương cạnh tranh, ngang bằng với mặt bằng chung thị trường (Chênh lệch khoảng ${percentageDiff}%).`;
      }
    }

    salaryAnalysis = {
      predictedSalary: Math.round(predictedSalary * 10) / 10,
      actualSalary,
      status,
      percentageDiff,
      comparisonMessage,
    };
  } catch (err) {
    console.error("Error computing salary analysis in Server Component:", err);
  }

  // 4. Fetch Related Jobs directly on the server
  const relatedJobs = await getRelatedJobs(slug);

  // 5. Build JSON-LD schemas
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phuquocjobs.vn';

  const jobSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    'title': job.title,
    'description': job.description + (job.requirements ? `\n\nYêu cầu:\n${job.requirements}` : '') + (job.benefits ? `\n\nQuyền lợi:\n${job.benefits}` : ''),
    'datePosted': job.createdAt || '2026-06-01T00:00:00.000Z',
    'employmentType': job.type === 'PART_TIME' ? 'PART_TIME' : job.type === 'CONTRACT' ? 'CONTRACT' : job.type === 'INTERNSHIP' ? 'INTERNSHIP' : 'FULL_TIME',
    'hiringOrganization': {
      '@type': 'Organization',
      'name': job.company.name,
      'logo': job.company.logo || undefined,
      'sameAs': job.company.website || undefined,
    },
    'jobLocation': {
      '@type': 'Place',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': job.ward?.name || 'Phú Quốc',
        'addressRegion': 'Kiên Giang',
        'addressCountry': 'VN',
        'streetAddress': job.addressDetail || undefined,
      }
    },
    ...(job.salaryMin || job.salaryMax ? {
      'baseSalary': {
        '@type': 'MonetaryAmount',
        'currency': 'VND',
        'value': {
          '@type': 'QuantitativeValue',
          'minValue': job.salaryMin || undefined,
          'maxValue': job.salaryMax || undefined,
          'unitText': 'MONTH'
        }
      }
    } : {})
  };

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
        'name': 'Việc làm',
        'item': `${baseUrl}/jobs`,
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': job.category.name,
        'item': `${baseUrl}/jobs?category=${encodeURIComponent(job.category.name)}`,
      },
      {
        '@type': 'ListItem',
        'position': 4,
        'name': job.title,
        'item': `${baseUrl}/jobs/${job.slug}`,
      }
    ]
  };

  const relatedJobsSchema = relatedJobs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Việc làm liên quan',
    'itemListElement': relatedJobs.map((item: RelatedJob, index: number) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'url': `${baseUrl}/jobs/${item.slug}`,
      'name': item.title,
    }))
  } : null;

  // Cast job to JobDetails for client component validation
  const serializedJob = {
    id: job.id,
    title: job.title,
    slug: job.slug,
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    type: job.type,
    experience: job.experience,
    level: job.level,
    quantity: job.quantity,
    deadline: job.deadline ? new Date(job.deadline).toISOString() : null,
    createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : '',
    company: {
      id: job.company.id,
      name: job.company.name,
      logo: job.company.logo,
      website: job.company.website,
      description: job.company.description,
      size: job.company.size,
      industry: job.company.industry,
      addressDetail: job.company.addressDetail,
      ward: job.company.ward ? { name: job.company.ward.name } : null
    },
    category: { name: job.category.name },
    ward: job.ward ? { name: job.ward.name } : null,
    addressDetail: job.addressDetail,
    quizId: job.quizId,
    latitude: job.latitude,
    longitude: job.longitude,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {relatedJobsSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(relatedJobsSchema) }}
        />
      )}

      <JobDetailsClient
        job={serializedJob}
        relatedJobs={relatedJobs}
        salaryAnalysis={salaryAnalysis}
        initialSaved={initialSaved}
        initialApplications={initialApplications}
        userResumes={userResumes}
        user={user}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}