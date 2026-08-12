import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getLatestModel, predictSalary } from '@/lib/salaryPredictor';
import JobDetailsClient, { JobDetails } from '@/components/jobs/JobDetailsClient';
import { verifyToken } from '@/lib/auth';

interface PageProps {
  params: Promise<{ slug: string }>;
}
interface JobResponse {
  title: string;
  description: string;
}

import { prisma } from '@/lib/prisma';
import { companyPublicSelect } from '@/lib/prismaSafe';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const job = await prisma.job.findUnique({
      where: { slug },
      select: { title: true, description: true }
    });
    if (job) {
      return { title: `${job.title} | Phú Quốc Jobs`, description: job.description?.slice(0, 160) || '' };
    }
  } catch {
    // fallback
  }
  return { title: 'Công việc | Phú Quốc Jobs', description: 'Chi tiết công việc' };
}

export default async function JobViewPage({ params }: PageProps) {
  const { slug } = await params;

  // Direct DB Query (No HTTP internal loop)
  const jobRaw = await prisma.job.findUnique({
    where: { slug },
    include: {
      company: { select: companyPublicSelect },
      category: { select: { name: true, slug: true } },
      ward: { select: { name: true, slug: true } },
      _count: { select: { applications: true } }
    }
  });

  if (!jobRaw) {
    notFound();
  }

  const job = jobRaw as unknown as JobDetail;

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
      if (payload) {
        isAuthenticated = true;
        user = payload;
        const [resumes, savedRecord, applications] = await Promise.all([
          prisma.resume.findMany({ where: { userId: payload.id as string } }),
          prisma.savedJob.findUnique({ where: { userId_jobId: { userId: payload.id as string, jobId: jobRaw.id } } }),
          prisma.application.findMany({ where: { userId: payload.id as string, jobId: jobRaw.id } })
        ]);
        userResumes = resumes.map(r => ({ id: r.id, title: r.title || 'CV', isDefault: r.isDefault }));
        initialSaved = !!savedRecord;
        initialApplications = applications.map(a => ({ id: a.id, jobId: a.jobId, status: a.status }));
      }
    }
  } catch {
    // Guest view
  }

  const model = getLatestModel();

  // 3. Compute Salary Analysis directly on the server
  let salaryAnalysis = null;
  try {
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

  // Query related jobs directly from DB for fast & reliable rendering
  let relatedJobs: any[] = [];
  try {
    relatedJobs = await prisma.job.findMany({
      where: {
        id: { not: jobRaw.id },
        isVisible: true
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: companyPublicSelect },
        category: { select: { name: true } },
        ward: { select: { name: true } }
      }
    });
  } catch (err) {
    console.error("Error fetching related jobs:", err);
  }

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