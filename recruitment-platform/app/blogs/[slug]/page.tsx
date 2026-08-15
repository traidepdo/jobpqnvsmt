import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import HtmlViewer from './_components/HtmlViewer';
import BlogViewTracker from '@/components/blogs/BlogViewTracker';
import { getBlogPostDetailServer, getBlogPostMetadataServer } from '@/server/services/blog/blogdetail.services';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    return getBlogPostMetadataServer(slug);
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;

    const data = await getBlogPostDetailServer(slug);
    if (!data) notFound();

    const { post, toc, content } = data;

    // ── Landing page: delegate sang client component để tránh hydration mismatch
    if (post.type === 'HTML_PAGE') {
        return <HtmlViewer content={content} toc={toc} />;
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
            <BlogViewTracker blogId={post.id} />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <style dangerouslySetInnerHTML={{
                __html: `
                html {
                    scroll-behavior: smooth;
                    scroll-padding-top: 80px;
                }
            `}} />
            <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Cột trái: Nội dung bài viết */}
                <div className="lg:col-span-3">
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
                            className="w-full h-96 object-cover rounded-2xl mb-8" />
                    )}

                    <div
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: content }}
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

                {/* Cột phải: Mục lục bài viết (Sticky) */}
                <div className="lg:col-span-1">
                    {toc.length > 0 && (
                        <div className="sticky top-24 bg-gray-50/60 border border-gray-150 rounded-2xl p-5 shadow-sm">
                            <div className="mb-4">
                                <p className="font-extrabold text-[#041b3c] flex items-center gap-2 text-xs uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[20px] text-[#00b14f]">toc</span>
                                    Mục lục bài viết
                                </p>
                                <div className="w-8 h-0.5 bg-[#00b14f] rounded-full mt-2" />
                            </div>
                            <ul className="space-y-3">
                                {toc.map((item) => (
                                    <li key={item.id} className="group">
                                        <a href={`#${item.id}`} className="text-gray-600 hover:text-[#00b14f] transition-all duration-200 flex items-start gap-2.5 leading-relaxed font-semibold text-xs group-hover:translate-x-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-[#00b14f] group-hover:scale-125 transition-all duration-200 mt-1.5 flex-shrink-0" />
                                            <span className="flex-1">{item.text}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}