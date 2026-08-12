import ClientBlogs from "@/components/blogs/ClientBlogs";
import { blogServices } from "@/server/services/blog/blog.services";
import { getblogcategory } from "@/server/services/categoty.services";

interface PageProps {
    searchParams: Promise<{ page?: string; limit?: string; query?: string }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;
    const page = Number(resolvedParams.page) || 1;
    const limit = Number(resolvedParams.limit) || 12;
    const query = resolvedParams.query || undefined;

    const { blogs, metadata } = await blogServices.get({ page, limit, query });
    const categories = await getblogcategory();

    return (
        <ClientBlogs blogs={blogs} metadata={metadata} categories={categories} />
    );
}
