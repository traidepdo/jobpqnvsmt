import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JobStatus } from '@prisma/client';
import { companyCardSelect } from '@/lib/prismaSafe';
import { getLatestModel, predictSalary } from '@/lib/salaryPredictor';

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const skip = (page - 1) * limit;
    const query = searchParams.get('query')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const salary = searchParams.get('salary')?.trim() || '';
    const type = searchParams.get('type')?.trim() || '';
    const location = searchParams.get('location')?.trim() || '';
    const experience = searchParams.get('experience')?.trim() || '';
    const level = searchParams.get('level')?.trim() || '';
    const sort = searchParams.get('sort')?.trim() || '';

    const andConditions: object[] = [];

    if (query) {
      andConditions.push({
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { company: { name: { contains: query } } },
        ],
      });
    }

    if (location) {
      andConditions.push({
        OR: [
          { ward: { name: { contains: location } } },
          { addressDetail: { contains: location } },
        ],
      });
    }

    if (salary) {
      switch (salary) {
        case 'lt10':
          andConditions.push(getSalaryMinCondition('lte', 10_000_000));
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
        orderBy = { salaryMin: 'asc' };
        break;
      case 'maxsalary':
        orderBy = { salaryMin: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }
    const where = {
      status: JobStatus.ACTIVE,
      ...(category && { category: { slug: category } }),
      ...(type && { type: type as never }),
      ...(experience && { experience: experience as never }),
      ...(level && { level: level as never }),
      ...(andConditions.length > 0 && { AND: andConditions }),
    };
    const [jobs, total, categories] = await Promise.all([
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
    ]);

    const model = await getLatestModel();
    const jobsWithAnalysis = jobs.map(job => {
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

    return NextResponse.json({
      jobs: jobsWithAnalysis,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      categories,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
