import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JobStatus } from '@prisma/client';
import { companyCardSelect } from '@/lib/prismaSafe';

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
        case 'lt5':
          andConditions.push({ salaryMax: { lte: 5_000_000 } });
          break;
        case 'to5':
          andConditions.push({ salaryMin: { gte: 5_000_000 } });
          break;
        case 'to10':
          andConditions.push({ salaryMin: { gte: 10_000_000 } });
          break;
        case 'to20':
          andConditions.push({ salaryMin: { gte: 20_000_000 } });
          break;
        case 'to30':
          andConditions.push({ salaryMin: { gte: 30_000_000 } });
          break;
        case 'to40':
          andConditions.push({ salaryMin: { gte: 40_000_000 } });
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
        orderBy = { salaryMax: 'desc' };
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

    return NextResponse.json({
      jobs,
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
