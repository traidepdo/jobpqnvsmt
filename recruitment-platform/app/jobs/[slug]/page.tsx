import React from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { companyPublicSelect } from '@/lib/prismaSafe';
import { getLatestModel, predictSalary } from '@/lib/salaryPredictor';
import JobDetailsClient from './JobDetailsClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const job = await prisma.job.findUnique({
    where: { slug },
    select: {
      title: true,
      company: { select: { name: true } },
      ward: { select: { name: true } },
    }
  });

  if (!job) {
    return {
      title: 'Không tìm thấy công việc | Phú Quốc Jobs',
      description: 'Công việc này đã đóng hoặc không tồn tại.'
    };
  }

  const title = `${job.title} - ${job.company.name} | Phú Quốc Jobs`;
  const description = `${job.title} tuyển dụng tại ${job.company.name} (${job.ward?.name || 'Phú Quốc'}). Mức lương hấp dẫn, môi trường làm việc chuyên nghiệp. Nộp hồ sơ ứng tuyển ngay!`;

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

export default async function JobViewPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Fetch main job detail from DB
  const job = await prisma.job.findUnique({
    where: { slug },
    include: {
      company: { select: companyPublicSelect },
      category: { select: { name: true } },
      ward: { select: { name: true } }
    }
  });

  if (!job) {
    notFound();
  }

  // 2. Fetch User & Auth related data
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  let user = null;
  let isAuthenticated = false;
  let userResumes: any[] = [];
  let initialSaved = false;
  let initialApplications: any[] = [];

  if (token) {
    try {
      const payload = await verifyToken(token);
      if (payload) {
        user = payload;
        if (payload.role === 'CANDIDATE') {
          isAuthenticated = true;

          // Fetch user resumes, save status, and applications in parallel
          const [resumes, savedJobRecord, candidateApps] = await Promise.all([
            prisma.resume.findMany({
              where: { userId: payload.id },
              orderBy: { updatedAt: 'desc' },
              select: {
                id: true,
                title: true,
              }
            }),
            prisma.savedJob.findUnique({
              where: { userId_jobId: { userId: payload.id, jobId: job.id } }
            }),
            prisma.application.findMany({
              where: { userId: payload.id },
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                jobId: true,
                status: true,
              }
            })
          ]);

          userResumes = resumes;
          initialSaved = !!savedJobRecord;
          initialApplications = candidateApps;
        }
      }
    } catch (err) {
      console.error("Error reading token in Job Page Server Component:", err);
    }
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
  let relatedJobs: any[] = [];
  try {
    let recommendedIds: string[] = [];

    // Query Django recommender API
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/jobs/${job.id}/recommend/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.INTERNAL_API_KEY || ""}`,
        },
        next: { revalidate: 60 } // Cache recommendations for 60s
      });

      if (response.ok) {
        const data = await response.json();
        const recommendations = data.recommendations || [];
        recommendedIds = recommendations.map((r: any) => r.id);
      }
    } catch (fetchError) {
      console.warn("Django Recommender API is offline. Falling back to DB-based recommendation.");
    }

    // Fallback: Query jobs in the same category if Django recommendations are empty or service is offline
    if (recommendedIds.length === 0) {
      relatedJobs = await prisma.job.findMany({
        where: {
          categoryId: job.categoryId,
          id: { not: job.id },
          isVisible: true
        },
        take: 4,
        include: {
          company: { select: companyPublicSelect },
          category: { select: { name: true } },
          ward: { select: { name: true } }
        }
      });
    } else {
      // Query rich details from Prisma for these IDs
      const richRelatedJobs = await prisma.job.findMany({
        where: {
          id: { in: recommendedIds },
          isVisible: true
        },
        include: {
          company: { select: companyPublicSelect },
          category: { select: { name: true } },
          ward: { select: { name: true } }
        }
      });

      // Sort them to preserve the similarity order returned by Django
      relatedJobs = recommendedIds
        .map((id: string) => richRelatedJobs.find((j: any) => j.id === id))
        .filter(Boolean);
    }
  } catch (err) {
    console.error("Error fetching related jobs in Server Component:", err);
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
    'itemListElement': relatedJobs.map((item, index) => ({
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
    deadline: job.deadline ? job.deadline.toISOString() : null,
    createdAt: job.createdAt ? job.createdAt.toISOString() : '',
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