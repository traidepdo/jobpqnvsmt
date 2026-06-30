import { getBlogs, getCategogyBlogs } from "@/lib/services/blogs/main";
import ClientBlogs from "@/components/blogs/ClientBlogs";

interface PageProps {
    searchParams: Promise<{ page?: string; limit?: string; query?: string }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;
    const page = Number(resolvedParams.page) || 1;
    const limit = Number(resolvedParams.limit) || 12;
    const query = resolvedParams.query || undefined;

    const { blogs, metadata } = await getBlogs({ page, limit, query });
    const categories = await getCategogyBlogs();

    return (
        <ClientBlogs blogs={blogs} metadata={metadata} categories={categories} />
    );
}
