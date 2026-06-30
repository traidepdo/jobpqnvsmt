import { useState, useEffect, useRef } from "react";
import { Blogs } from "../types/blogs/main";
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
}
export default function useBlogs({ blogs, metadata }: ClientBlogsProps) {
    const router = useRouter();
    const [blogData, setBlogData] = useState(blogs);
    const [searchValue, setSearchValue] = useState(metadata.query || '');
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
    return { blogData, searchValue, setSearchValue, handleSearch, handlePageChange };
}