import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Bộ nhớ đệm cục bộ (In-Memory Fallback Cache) để tối ưu hóa tốc độ gợi ý (~0ms) và tiết kiệm tài nguyên
const memoryCache = new Map<string, { data: any; expiry: number }>();

function getMemoryCache(key: string) {
  const cached = memoryCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  if (cached) {
    memoryCache.delete(key);
  }
  return null;
}

function setMemoryCache(key: string, data: any, ttlSeconds = 1800) { // Cache trong 30 phút để hạn chế truy vấn DB
  memoryCache.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q) {
      return NextResponse.json({ suggestions: [] });
    }

    // 1. Chuẩn hóa từ khóa: viết thường, xóa khoảng trắng thừa đầu cuối và thay thế khoảng trắng giữa bằng 1 dấu cách duy nhất
    const query = q.toLowerCase().trim().replace(/\s+/g, ' ');

    if (!query) {
      return NextResponse.json({ suggestions: [] });
    }

    const cacheKey = `search:suggest:${query}`;

    // 2. Kiểm tra bộ nhớ đệm In-Memory trước (Phản hồi ngay ~0ms)
    const memCached = getMemoryCache(cacheKey);
    if (memCached) {
      return NextResponse.json({
        suggestions: memCached,
        source: 'memory'
      });
    }

    // 3. Cache Miss: Gọi DB dùng Postgres native unaccent và ILIKE kết hợp GROUP BY loại trùng lặp
    // (Đã vô hiệu hóa Redis để tránh tốn quota tài khoản Upstash Cloud)
    const words = query.split(' ').filter(Boolean);
    const queryParams: any[] = [
      query,          // $1: exact match
      `${query}%`,    // $2: prefix match
    ];

    let whereClause = "WHERE j.status = 'ACTIVE'";
    words.forEach((word) => {
      queryParams.push(`%${word}%`);
      const paramIndex = queryParams.length;
      whereClause += ` AND unaccent(j.title) ILIKE unaccent($${paramIndex})`;
    });

    const sqlQuery = `
      SELECT MIN(j.id) as id, j.title
      FROM jobs j
      ${whereClause}
      GROUP BY j.title
      ORDER BY 
        CASE 
          WHEN unaccent(j.title) ILIKE unaccent($1) THEN 1
          WHEN unaccent(j.title) ILIKE unaccent($2) THEN 2
          ELSE 3
        END ASC,
        (MAX(j.views_count) + MAX(j.applies_count) * 3) DESC,
        MAX(j."createdAt") DESC
      LIMIT 10
    `;

    const jobs: any[] = await prisma.$queryRawUnsafe(sqlQuery, ...queryParams);
    const result = jobs.map(j => ({ id: j.id, title: j.title }));

    // 4. Lưu vào cache bộ nhớ đệm In-Memory (30 phút)
    setMemoryCache(cacheKey, result, 1800);

    return NextResponse.json({ 
      suggestions: result, 
      source: 'db' 
    });

  } catch (error) {
    console.error('API Search Suggestion Error:', error);
    
    // Hướng xử lý dự phòng (Fallback): Tìm kiếm text thông thường nếu xảy ra lỗi AI/DB
    try {
      const { searchParams } = new URL(req.url);
      const q = searchParams.get('q') || '';
      const normalizedQuery = q.toLowerCase().trim().replace(/\s+/g, ' ');

      const fallbackJobs = await prisma.job.groupBy({
        by: ['title'],
        where: {
          title: { contains: normalizedQuery, mode: 'insensitive' },
          status: 'ACTIVE'
        },
        take: 10,
        orderBy: {
          title: 'asc'
        },
        _min: {
          id: true
        }
      });
      
      const result = fallbackJobs.map((j: any) => ({ id: j._min.id, title: j.title }));
      
      return NextResponse.json({ 
        suggestions: result, 
        source: 'fallback' 
      });
    } catch (fallbackError) {
      console.error('Search Suggestion Fallback also failed:', fallbackError);
      return NextResponse.json({ suggestions: [], error: 'Internal Server Error' }, { status: 500 });
    }
  }
}