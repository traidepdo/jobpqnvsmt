// app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/requireAdmin';

// UTC+7 midnight N days ago → dùng làm WHERE clause
function getDaysAgo(days: number): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - days);
    return d;
}

// Fill toàn bộ ngày trong range, count = 0 nếu không có data
function fillDays(days: number, data: { date: string; count: number }[]) {
    const map = new Map(data.map(d => [d.date, d.count]));
    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // Format YYYY-MM-DD theo local time
        const key = [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getDate()).padStart(2, '0'),
        ].join('-');
        result.push({ date: key, count: map.get(key) ?? 0 });
    }
    return result;
}

export async function GET(req: Request) {
    const result = await requireAdmin();
    if ('error' in result) return result.error;

    const { searchParams } = new URL(req.url);
    const range = Math.min(Math.max(parseInt(searchParams.get('range') ?? '30'), 7), 90);
    const since = getDaysAgo(range);

    // ── Chart: jobs mới theo ngày ──────────────────────────────
    const rawJobs = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT
        to_char("createdAt" + INTERVAL '7 hour', 'YYYY-MM-DD') AS date,
        COUNT(*) AS count
    FROM jobs
    WHERE "createdAt" >= ${since}
    GROUP BY to_char("createdAt" + INTERVAL '7 hour', 'YYYY-MM-DD')
    ORDER BY date ASC
`;

    const jobsSeries = fillDays(range, rawJobs.map(r => ({
        date: String(r.date),
        count: Number(r.count),
    })));

    // ── Top 10 jobs nhiều ứng tuyển nhất ──────────────────────
    const topJobs = await prisma.job.findMany({
        where: {
            applications: { some: { createdAt: { gte: since } } },
        },
        select: {
            id: true,
            title: true,
            company: { select: { name: true, logo: true } },
            _count: {
                select: {
                    applications: { where: { createdAt: { gte: since } } },
                },
            },
        },
        orderBy: { applications: { _count: 'desc' } },
        take: 10,
    });

    // ── Summary ────────────────────────────────────────────────
    const [totalJobs, totalApps, totalUsers, totalCompanies] = await Promise.all([
        prisma.job.count({ where: { createdAt: { gte: since } } }),
        prisma.application.count({ where: { createdAt: { gte: since } } }),
        prisma.user.count({ where: { createdAt: { gte: since } } }),
        prisma.company.count({ where: { createdAt: { gte: since } } }),
    ]);

    return NextResponse.json({
        range,
        summary: { totalJobs, totalApps, totalUsers, totalCompanies },
        series: { jobs: jobsSeries },
        topJobs: topJobs.map(j => ({
            id: j.id,
            title: j.title,
            company: j.company.name,
            logo: j.company.logo,
            count: j._count.applications,
        })),
    });
}