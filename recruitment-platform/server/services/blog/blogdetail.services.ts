import { prisma } from "@/lib/prisma";

export async function getBlogCategoryDetailServer(slug: string, options?: { page?: number; limit?: number; search?: string }) {
    try {
        const page = Math.max(1, options?.page || 1);
        const limit = Math.max(1, Math.min(50, options?.limit || 10));
        const skip = (page - 1) * limit;
        const search = options?.search || "";

        const currentCategory = await prisma.blogCategory.findUnique({
            where: { slug: slug },
            select: {
                id: true,
                name: true,
                slug: true,
            }
        });

        if (!currentCategory) {
            return { ok: false as const, error: "Danh mục ngành nghề này không tồn tại." };
        }

        const whereCondition: any = {
            categoryId: currentCategory.id,
        };

        if (search) {
            whereCondition.title = {
                contains: search,
                mode: "insensitive"
            };
        }

        const [total, blogs] = await Promise.all([
            prisma.blog.count({ where: whereCondition }),
            prisma.blog.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnail: true,
                    excerpt: true,
                    createdAt: true,
                    updatedAt: true,
                    author: {
                        select: {
                            name: true,
                            avatar: true
                        }
                    },
                }
            })
        ]);

        const hasNext = skip + limit < total;
        const hasPrevious = page > 1;

        return {
            ok: true as const,
            data: {
                category: currentCategory,
                blogs,
                pagination: {
                    total,
                    page,
                    limit,
                    hasNext,
                    hasPrevious,
                    totalPages: Math.ceil(total / limit)
                },
            },
        };
    } catch (error) {
        console.error("Lỗi getBlogCategoryDetailServer:", error);
        return { ok: false as const, error: "Đã xảy ra lỗi máy chủ nội bộ." };
    }
}

export function parseToc(htmlContent: string) {
    const headings: { id: string; text: string }[] = [];
    let counter = 0;

    // Match h2 tags (case-insensitive) and inject unique IDs
    const updatedContent = htmlContent.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (match, attrs, contentText) => {
        // Strip any nested HTML tags from the header text for the link label
        const plainText = contentText.replace(/<[^>]+>/g, '').trim();
        counter++;
        const id = `muc-luc-${counter}`;
        headings.push({ id, text: plainText });
        return `<h2${attrs} id="${id}">${contentText}</h2>`;
    });

    return { toc: headings, content: updatedContent };
}

export async function getBlogPostDetailServer(slug: string) {
    const postExists = await prisma.blog.findUnique({
        where: { slug, isPublished: true },
    });

    if (!postExists) return null;

    // Increment views
    const post = await prisma.blog.update({
        where: { id: postExists.id },
        data: { views: { increment: 1 } },
        include: {
            author: { select: { name: true } },
            category: { select: { name: true, slug: true } },
            tags: { include: { tag: { select: { name: true, slug: true } } } },
        },
    });

    const { toc, content } = parseToc(post.content);

    return { post, toc, content };
}

export async function getBlogPostMetadataServer(slug: string) {
    const post = await prisma.blog.findUnique({
        where: { slug, isPublished: true },
        select: { title: true, excerpt: true, thumbnail: true },
    });
    if (!post) return {};
    return {
        title: post.title,
        description: post.excerpt || undefined,
        openGraph: { images: post.thumbnail ? [post.thumbnail] : [] },
    };
}