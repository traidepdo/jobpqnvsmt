// app/blogs/[slug]/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import HtmlViewer from './_components/HtmlViewer';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
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

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;

    const post = await prisma.blog.findUnique({
        where: { slug, isPublished: true },
        include: {
            author: { select: { name: true } },
            category: { select: { name: true, slug: true } },
            tags: { include: { tag: { select: { name: true, slug: true } } } },
        },
    });

    if (!post) notFound();

    // ── Landing page: delegate sang client component để tránh hydration mismatch
    if (post.type === 'HTML_PAGE') {
        return <HtmlViewer content={post.content} />;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phuquocjobs.vn';

    const blogSchema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': post.title,
        'description': post.excerpt || undefined,
        'image': post.thumbnail ? [post.thumbnail] : [],
        'datePublished': post.createdAt.toISOString(),
        'dateModified': post.updatedAt.toISOString(),
        'author': {
            '@type': 'Person',
            'name': post.author.name,
        },
        'publisher': {
            '@type': 'Organization',
            'name': 'Phú Quốc Jobs',
            'logo': {
                '@type': 'ImageObject',
                'url': 'https://static.thenounproject.com/png/2714603-200.png'
            }
        }
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
                'name': 'Blog & Tin tức',
                'item': `${baseUrl}/blogs`,
            },
            ...(post.category ? [{
                '@type': 'ListItem',
                'position': 3,
                'name': post.category.name,
                'item': `${baseUrl}/blogs?category=${post.category.slug}`,
            }] : []),
            {
                '@type': 'ListItem',
                'position': post.category ? 4 : 3,
                'name': post.title,
                'item': `${baseUrl}/blogs/${post.slug}`,
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <div className="max-w-3xl mx-auto px-4 py-10">
            {post.category && (
                <a href={`/blogs?category=${post.category.slug}`}
                    className="inline-block text-xs font-semibold text-[#00963e] bg-[#f0faf4] px-3 py-1 rounded-full mb-4 hover:bg-[#e0f5ea] transition-colors">
                    {post.category.name}
                </a>
            )}

            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-4">{post.title}</h1>

            <div className="flex items-center gap-3 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-100">
                <span>{post.author.name}</span>
                <span>·</span>
                <span>{new Date(post.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                <span>·</span>
                <span>{post.views.toLocaleString()} lượt xem</span>
            </div>

            {post.thumbnail && (
                <img src={post.thumbnail} alt={post.title}
                    className="w-full h-72 object-cover rounded-2xl mb-8" />
            )}

            <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-gray-100">
                    {post.tags.map(({ tag }) => (
                        <a key={tag.slug} href={`/blogs?tag=${tag.slug}`}
                            className="text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors">
                            #{tag.name}
                        </a>
                    ))}
                </div>
            )}
        </div>
        </>
    );
}