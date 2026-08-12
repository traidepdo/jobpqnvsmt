import { prisma } from '@/lib/prisma';
import { JobStatus } from '@prisma/client';
import { companyCardSelect } from '@/lib/prismaSafe';
import { getLatestModel, predictSalary } from '@/lib/salaryPredictor';
import { verifyToken } from '@/lib/auth';
import { cacheLife } from 'next/cache';

interface JobSearchParams {
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
}
interface MatchedCompany {
  id: string;
  name: string;
  logo: string;
  slug: string;
  industry: string;
  _count: { jobs: number };
}

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

export async function getJobsLayoutData() {
  const now = new Date();
  const [categories, topCompanies, wards] = await Promise.all([
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            jobs: {
              where: {
                status: JobStatus.ACTIVE,
                OR: [
                  { deadline: null },
                  { deadline: { gte: now } }
                ]
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
    }),
    prisma.company.findMany({
      where: { isApproved: true, isActive: true },
      select: {
        name: true,
        logo: true,
        slug: true,
        jobs: {
          select: {
            id: true,
            status: true,
            deadline: true,
            _count: {
              select: { applications: true }
            }
          }
        }
      }
    }),
    prisma.ward.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
  ]);

  const featuredCompanies = topCompanies
    .map(c => {
      const totalApplies = c.jobs.reduce((sum, j) => sum + (j._count?.applications || 0), 0);
      const activeJobCount = c.jobs.filter(j => j.status === JobStatus.ACTIVE && (!j.deadline || new Date(j.deadline) >= now)).length;
      return {
        name: c.name,
        logo: c.logo,
        slug: c.slug,
        totalApplies,
        jobCount: activeJobCount
      };
    })
    .filter(c => c.jobCount > 0)
    .sort((a, b) => {
      if (b.totalApplies !== a.totalApplies) {
        return b.totalApplies - a.totalApplies;
      }
      return b.jobCount - a.jobCount;
    })
    .slice(0, 6);

  return { categories, featuredCompanies, wards };
}

export async function getJobsListData(params: JobSearchParams, token?: string) {
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
  const featured = params.featured?.trim() || '';
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

  let orderBy: any = {};
  if (featured === 'true' && sort === 'newest') {
    orderBy = { applications: { _count: 'desc' } };
  } else {
    switch (sort) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'minsalary':
        orderBy = [
          { salaryMin: { sort: 'asc', nulls: 'last' } },
          { salaryMax: { sort: 'asc', nulls: 'last' } }
        ];
        break;
      case 'maxsalary':
        orderBy = [
          { salaryMin: { sort: 'desc', nulls: 'last' } },
          { salaryMax: { sort: 'desc', nulls: 'last' } }
        ];
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }
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

  const now = new Date();
  const where = {
    status: JobStatus.ACTIVE,
    OR: [
      { deadline: null },
      { deadline: { gte: now } }
    ],
    ...(category && { category: { slug: category } }),
    ...(companySlug && { company: { slug: companySlug } }),
    ...(type && { type: type as never }),
    ...(experience && { experience: experience as never }),
    ...(level && { level: level as never }),
    ...(andConditions.length > 0 && { AND: andConditions }),
  };

  const [rawJobs, total] = await Promise.all([
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
    prisma.job.count({ where })
  ]);

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


  let matchedCompanies: any[] = [];
  if (query) {
    matchedCompanies = await prisma.company.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
        isActive: true,
        isApproved: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        size: true,
        industry: true,
        _count: {
          select: {
            jobs: {
              where: {
                status: JobStatus.ACTIVE,
                OR: [
                  { deadline: null },
                  { deadline: { gte: now } }
                ]
              }
            }
          }
        }
      },
      take: 4
    });
  }

  return {
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
    featured
  };
}

export async function getFilteredJobs(params: JobSearchParams, token?: string) {
  const [layout, list] = await Promise.all([
    getJobsLayoutData(),
    getJobsListData(params, token)
  ]);
  return {
    ...layout,
    ...list
  };
}
