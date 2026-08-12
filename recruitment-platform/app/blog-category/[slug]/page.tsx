import { getBlogCategoryDetailServer } from "@/server/services/blog/blogdetail.services";
import JobCategoryBlogPageCLient from "@/components/blogs/blogcategory/blogcategoryClient.component";
import { BlogPost } from "@/lib/types/blogs/blogcategory.type";

export default async function JobCategoryBlogPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string; search?: string }> }) {
    const { slug } = await params;
    const query = await searchParams;
    const currentPage = parseInt(query.page || "1");
    const currentSearch = query.search || "";

    const res = await getBlogCategoryDetailServer(slug, {
        page: currentPage,
        limit: 12,
        search: currentSearch,
    });

    if (!res.ok) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-center">
                <div>
                    <p className="text-muted-foreground">Không tìm thấy danh mục.</p>
                </div>
            </div>
        );
    }
    const { category, blogs, pagination } = res.data;
    const inputblog: BlogPost[] = blogs.map((blog) => ({
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        thumbnail: blog.thumbnail || "",
        excerpt: blog.excerpt || "",
        createdAt: String(blog.createdAt),
        author: { name: blog.author.name || "", avatar: blog.author.avatar || "" },
    }));
    return (
        <JobCategoryBlogPageCLient inputcategory={category} inputblogs={inputblog} inputpagination={pagination} currentSearch={currentSearch} currentPage={currentPage} slug={slug} />
    )
}