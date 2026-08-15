import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getLatestModel } from '@/lib/salaryPredictor';
import { useSalaryAnalysis } from '@/lib/hooks/useSalaryAnalysis';
import JobDetailsClient, { JobDetails } from '@/components/jobs/JobDetailsClient';
import { verifyToken } from '@/lib/auth';
import { jobsDetailService } from '@/server/services/jobs/detail.services';
import { data } from '@tensorflow/tfjs';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const job = await jobsDetailService.getJobMetadata(slug);
    if (job) {
      return { title: `${job.title} | Phú Quốc Jobs`, description: job.description?.slice(0, 160) || '' };
    }
  } catch {
    return {
          
    }
  }
  return { title: 'Công việc | Phú Quốc Jobs', description: 'Chi tiết công việc' };
}

export default async function JobViewPage({ params }: PageProps) {
  const { slug } = await params;

  // Query DB via Service Layer
  // lấy chi tiết công việc theo slug
  const jobRaw = await jobsDetailService.getJobDetail(slug);

  if (!jobRaw) {
    notFound();
  }

  const job = jobRaw as unknown as JobDetails;

  let userResumes: { id: string; title: string, isDefault: boolean }[] = [];
  let initialSaved = false;
  let initialApplications: { id: string; jobId: string; status: string }[] = [];
  let user = null;
  let isAuthenticated = false;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.id) {
        isAuthenticated = true;
        user = payload;
        // lấy thông tin trạng thái của user với công việc này
        const userState = await jobsDetailService.getUserJobState(jobRaw.id, payload.id as string);
        userResumes = userState.userResumes;
        initialSaved = userState.initialSaved;
        initialApplications = userState.initialApplications;
      }
    }
  } catch {
    // Guest view
  }

  // lấy model dự đoán lương phù hợp với công việc này theo category 
  const model = await getLatestModel(jobRaw.categoryId);

  // Tính toán phân tích lương thông qua hook / helper
  const salaryAnalysis = useSalaryAnalysis(job, jobRaw.categoryId, jobRaw.wardId, model);

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
        'name': job.category?.name || 'Tất cả ngành nghề',
        'item': `${baseUrl}/jobs?category=${encodeURIComponent(job.category?.name || '')}`,
      },
      {
        '@type': 'ListItem',
        'position': 4,
        'name': job.title,
        'item': `${baseUrl}/jobs/${job.slug}`,
      }
    ]
  };

  // Fetch AI vector/NLP recommendations directly from SeverAI Django Backend
  let relatedJobs: any[] = [];
  try {
    const djangoUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://severai-api.onrender.com';
    const aiRes = await fetch(`${djangoUrl}/api/jobs/${jobRaw.id}/recommend/`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    });
    if (aiRes.ok) {
      const data = await aiRes.json();
      const recs = Array.isArray(data) ? data : (data.recommendations || []);
      const recIds = recs.map((r: any) => r.id).filter(Boolean);
      if (recIds.length > 0) {
        relatedJobs = await jobsDetailService.getRelatedJobsByIds(recIds);
      }
    } else {
      console.error("SeverAI response not OK:", aiRes.status, await aiRes.text());
    }
  } catch (err) {
    console.error("Error fetching SeverAI recommendations:", err);
  }

  const relatedJobsSchema = relatedJobs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Việc làm liên quan',
    'itemListElement': relatedJobs.map((item: any, index: number) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'url': `${baseUrl}/jobs/${item.slug}`,
      'name': item.title,
    }))
  } : null;

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
        job={job as unknown as JobDetails}
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