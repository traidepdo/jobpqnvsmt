import { prisma } from '@/lib/prisma';
import { Blogs, CategoryBlogs } from '@/lib/types/blogs/main'


export interface PaginatedBlogs {
    blogs: Blogs[];
    metadata: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        query?: string;
    }
}

export async function getBlogs({ page = 1, limit = 12, query }: { page?: number; limit?: number; query?: string } = {}): Promise<PaginatedBlogs> {
    const skip = (page - 1) * limit;

    const where = {
        isPublished: true,
        ...(query ? {
            OR: [
                { title: { contains: query, mode: 'insensitive' as const } },
                { excerpt: { contains: query, mode: 'insensitive' as const } },
                { content: { contains: query, mode: 'insensitive' as const } },
            ]
        } : {})
    };

    // Chạy song song cả hai câu lệnh truy vấn để tối ưu hóa hiệu năng
    const [data, total] = await Promise.all([
        prisma.blog.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc', // Sắp xếp bài viết mới nhất lên đầu
            },
            include: {
                category: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
            }
        }),
        prisma.blog.count({
            where
        })
    ]);

    const blogs: Blogs[] = data.map((blog) => {
        return {
            id: blog.id,
            slug: blog.slug,
            title: blog.title,
            description: blog.excerpt || '',
            content: blog.content,
            thumbnail: blog.thumbnail || '',
            category: {
                id: blog.category?.id || '',
                slug: blog.category?.slug || '',
                name: blog.category?.name || '',
            },
            author: {
                id: blog.author?.id || '',
                name: blog.author?.name || '',
            },
            views: blog.views,
            createdAt: blog.createdAt.toISOString(),
            updatedAt: blog.updatedAt.toISOString(),
        };
    });

    return {
        blogs,
        metadata: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            query,
        }
    };
}

export async function getCategogyBlogs(): Promise<CategoryBlogs[]> {
    const data = await prisma.blogCategory.findMany();
    return data.map((category) => {
        return {
            id: category.id,
            slug: category.slug,
            name: category.name,
        };
    });

}