import { useState, useEffect, useRef } from "react";
import { Blogs, CategoryBlogs } from "../types/blogs/main";
import { useRouter } from "next/navigation";
interface ClientBlogsProps {
    blogs: Blogs[];
    metadata: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        query?: string;
    };
    categories: CategoryBlogs[];
}
export default function useBlogs({ blogs, metadata, categories }: ClientBlogsProps) {
    const router = useRouter();
    const [blogData, setBlogData] = useState(blogs);
    const [searchValue, setSearchValue] = useState(metadata.query || '');
    const [category, setCategory] = useState<CategoryBlogs[]>(categories);
    const queryParams = new URLSearchParams();

    const handleSearch = (query: string) => {
        queryParams.set('page', '1');
        if (query.trim()) {
            queryParams.set('query', query.trim());
        }
        router.push(`/blogs?${queryParams.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const queryParams = new URLSearchParams();
        queryParams.set('page', newPage.toString());
        if (metadata.query) {
            queryParams.set('query', metadata.query);
        }
        router.push(`/blogs?${queryParams.toString()}`);
    };
    const top1blog = (blogs: Blogs[]) => {
        if (!blogs || blogs.length === 0) return undefined;
        const maxViews = Math.max(...blogs.map((blog) => blog.views));
        return blogs.find((blog) => blog.views === maxViews);
    }

    return { blogData, searchValue, setSearchValue, handleSearch, handlePageChange, category, top1blog };
}