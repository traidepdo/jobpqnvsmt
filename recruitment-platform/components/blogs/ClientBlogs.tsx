'use client';
import { Blogs } from "@/lib/types/blogs/main";
import Image from "next/image";
import Search from "./Search";
import useBlogs from "@/lib/hooks/useBlogs";

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

export default function ClientBlogs({ blogs, metadata }: ClientBlogsProps) {


    const { handleSearch, searchValue, setSearchValue, handlePageChange } = useBlogs({ metadata, blogs });

    const getPageNumbers = () => {
        const total = metadata.totalPages;
        const current = metadata.page;
        const pages: (number | string)[] = [];

        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);

            if (current > 3) {
                pages.push('...');
            }

            const start = Math.max(2, current - 1);
            const end = Math.min(total - 1, current + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (current < total - 2) {
                pages.push('...');
            }

            pages.push(total);
        }

        return pages;
    };

    return (
        <div className="max-w-[1300px] w-full mx-auto px-4 py-30">
            {/* Hero & Search Section */}
            <div className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-gray-100 pb-8">
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                        Tin tức &amp; Sự nghiệp
                    </h1>
                    <p className="text-gray-500 text-sm md:text-base max-w-xl">
                        Cập nhật các tin tức tuyển dụng mới nhất, cẩm nang nghề nghiệp và xu hướng thị trường lao động.
                    </p>
                </div>
                <div className="w-full md:w-auto flex justify-start md:justify-end">
                    <Search handleSearch={handleSearch} searchValue={searchValue} setSearchValue={setSearchValue} />
                </div>
            </div>

            {/* Render danh sách bài viết ở đây */}
            {blogs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogs.map((blog) => (
                        <article
                            key={blog.id}
                            className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                        >
                            {/* Thumbnail Container */}
                            <div className="relative w-full overflow-hidden bg-gray-100">
                                <Image
                                    src={blog.thumbnail || 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/28/66/93/04/caption.jpg?w=800&h=800&s=1'}
                                    alt={blog.title}
                                    width={600}
                                    height={338}
                                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                {blog.category?.name && (
                                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                                        {blog.category.name}
                                    </span>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-6 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                        <span>{blog.author?.name || 'Tác giả'}</span>
                                        <span>•</span>
                                        <span>{new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                                        <a href={`/blogs/${blog.slug}`}>{blog.title}</a>
                                    </h3>
                                    <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
                                        {blog.description}
                                    </p>
                                </div>

                                <div className="pt-6 mt-6 border-t border-gray-50 flex items-center justify-between text-sm">
                                    <a
                                        href={`/blogs/${blog.slug}`}
                                        className="text-blue-600 font-semibold inline-flex items-center gap-1.5 hover:text-blue-700"
                                    >
                                        Đọc thêm
                                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </a>
                                    <span className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {blog.views.toLocaleString()} lượt xem
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50 border border-dashed border-gray-200 rounded-2xl my-8">
                    <p className="text-gray-500 font-medium">Không tìm thấy bài viết nào phù hợp.</p>
                    <button
                        onClick={() => handleSearch('')}
                        className="mt-3 text-sm text-blue-600 font-semibold hover:underline"
                    >
                        Xóa bộ lọc tìm kiếm
                    </button>
                </div>
            )}

            {/* Điều hướng phân trang */}
            {metadata.totalPages > 1 && (
                <div className="flex gap-2 mt-12 justify-center items-center">
                    <button
                        onClick={() => handlePageChange(metadata.page - 1)}
                        disabled={metadata.page <= 1}
                        className="px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all font-medium text-sm text-gray-600 flex items-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Trước
                    </button>

                    <div className="flex items-center gap-1.5">
                        {getPageNumbers().map((pageNum, index) => {
                            if (pageNum === '...') {
                                return (
                                    <span key={`dots-${index}`} className="w-9 h-9 flex items-center justify-center text-gray-400 font-medium text-sm">
                                        ...
                                    </span>
                                );
                            }
                            const isActive = pageNum === metadata.page;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum as number)}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-sm transition-all ${isActive
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => handlePageChange(metadata.page + 1)}
                        disabled={metadata.page >= metadata.totalPages}
                        className="px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all font-medium text-sm text-gray-600 flex items-center gap-1.5"
                    >
                        Sau
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
