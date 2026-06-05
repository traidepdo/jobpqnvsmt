import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phuquocjobs.vn';

    // 1. Trang tĩnh chính
    const staticPages = [
        '',
        '/jobs',
        '/login',
        '/register',
        '/tao-cv',
    ].map(route => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1.0 : 0.8,
    }));

    // 2. Trang chi tiết công việc hoạt động (Active jobs)
    let jobsPages: MetadataRoute.Sitemap = [];
    try {
        const activeJobs = await prisma.job.findMany({
            where: {
                status: 'ACTIVE',
                isVisible: true,
            },
            select: {
                slug: true,
                updatedAt: true,
            },
        });
        jobsPages = activeJobs.map(job => ({
            url: `${baseUrl}/jobs/${job.slug}`,
            lastModified: job.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));
    } catch (err) {
        console.error('Error fetching jobs for sitemap:', err);
    }

    // 3. Trang chi tiết công ty được kích hoạt & phê duyệt
    let companiesPages: MetadataRoute.Sitemap = [];
    try {
        const activeCompanies = await prisma.company.findMany({
            where: {
                isActive: true,
                isApproved: true,
            },
            select: {
                slug: true,
                updatedAt: true,
            },
        });
        companiesPages = activeCompanies.map(company => ({
            url: `${baseUrl}/companies/${company.slug}`,
            lastModified: company.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }));
    } catch (err) {
        console.error('Error fetching companies for sitemap:', err);
    }

    // 4. Trang chi tiết bài viết Blog đã xuất bản
    let blogsPages: MetadataRoute.Sitemap = [];
    try {
        const publishedBlogs = await prisma.blog.findMany({
            where: {
                isPublished: true,
            },
            select: {
                slug: true,
                updatedAt: true,
            },
        });
        blogsPages = publishedBlogs.map(blog => ({
            url: `${baseUrl}/blogs/${blog.slug}`,
            lastModified: blog.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }));
    } catch (err) {
        console.error('Error fetching blogs for sitemap:', err);
    }

    return [
        ...staticPages,
        ...jobsPages,
        ...companiesPages,
        ...blogsPages,
    ];
}
