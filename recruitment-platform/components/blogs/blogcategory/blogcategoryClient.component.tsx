"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CategorySEO, BlogPost, PaginationData } from "@/lib/types/blogs/blogcategory.type";
import { BlogCard } from "@/components/blogs/blogcategory/BlogCard.component";
import { handleSearch, handlePage } from "@/lib/hooks/useBlogCategory";

function SkeletonCard() {
    return (
        <div className="animate-pulse bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="h-48 bg-slate-200" />
            <div className="p-5 space-y-3">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-5 w-full bg-slate-300 rounded" />
                <div className="h-5 w-4/5 bg-slate-200 rounded" />
                <div className="h-3 w-full bg-slate-100 rounded" />
                <div className="h-3 w-2/3 bg-slate-100 rounded" />
            </div>
        </div>
    );
}

export default function JobCategoryBlogPageCLient({ inputcategory, inputblogs, inputpagination, currentSearch, currentPage, slug }: { inputcategory: CategorySEO, inputblogs: BlogPost[], inputpagination: PaginationData, currentSearch: string, currentPage: number, slug: string }) {
    const router = useRouter();
    const [category, setCategory] = useState<CategorySEO | null>(inputcategory);
    const [blogs, setBlogs] = useState<BlogPost[]>(inputblogs);
    const [pagination, setPagination] = useState<PaginationData | null>(inputpagination);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState(currentSearch);


    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading && blogs.length === 0) return (
        <div className="min-h-screen bg-slate-50">
            <div className="animate-pulse bg-[#1e3a5f] py-20">
                <div className="max-w-5xl mx-auto px-6 space-y-4">
                    <div className="h-3 w-32 bg-white/20 rounded" />
                    <div className="h-12 w-1/2 bg-white/30 rounded-lg" />
                    <div className="h-4 w-2/3 bg-white/10 rounded" />
                </div>
            </div>
            <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[0, 1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
            </div>
        </div>
    );

    // ── Error ────────────────────────────────────────────────────────────────
    if (error) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center px-6 py-16 max-w-sm">
                <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-5">
                    <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Có lỗi xảy ra</h2>
                <p className="text-slate-500 text-sm mb-6">{error}</p>
                <button onClick={() => window.location.reload()}
                    className="px-5 py-2.5 bg-[#1e3a5f] text-white text-sm font-semibold rounded-lg hover:bg-[#162d4a] transition-colors">
                    Thử lại
                </button>
            </div>
        </div>
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .fade-up { animation: fadeUp 0.5s ease-out both; }
                .stretched-link::after { content:''; position:absolute; inset:0; }
            `}</style>

            <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">

                {/* ── HERO HEADER ─────────────────────────────────────────── */}
                <header className="relative bg-[#1e3a5f] overflow-hidden">
                    {/* Grid texture */}
                    <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',
                            backgroundSize: '40px 40px'
                        }} />
                    {/* Glow blob */}
                    <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[#2563a8] rounded-full blur-[100px] opacity-30 pointer-events-none translate-x-1/3 -translate-y-1/2" />

                    <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-24">
                        {/* Breadcrumb */}
                        <div className="fade-up flex items-center gap-2 text-xs text-white/50 font-medium mb-7" style={{ animationDelay: '0ms' }}>
                            <a href="/blogs" className="hover:text-white/80 transition-colors">Blog</a>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="text-white/70">{category?.name || '...'}</span>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                            <div className="max-w-2xl">
                                {/* Badge */}
                                <div className="fade-up inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-5"
                                    style={{ animationDelay: '60ms' }}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    <span className="text-[11px] font-semibold text-white/80 uppercase tracking-widest">Góc Ngành Nghề</span>
                                </div>

                                <h1 className="fade-up text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4"
                                    style={{ animationDelay: '120ms' }}>
                                    {category?.name || 'Đang tải...'}
                                </h1>

                                <p className="fade-up text-white/60 text-sm md:text-base leading-relaxed"
                                    style={{ animationDelay: '180ms' }}>
                                    {category?.description || "Tổng hợp thông tin tuyển dụng, kinh nghiệm làm việc thực tế và lộ trình thăng tiến nghề nghiệp bền vững."}
                                </p>
                            </div>

                            {/* Stats pill */}
                            {pagination && (
                                <div className="fade-up shrink-0 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 text-center min-w-[120px]"
                                    style={{ animationDelay: '240ms' }}>
                                    <p className="text-3xl font-extrabold text-white">{pagination.total}</p>
                                    <p className="text-xs text-white/60 font-medium mt-1">Bài viết</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Wave divider */}
                    <div className="relative h-10 overflow-hidden">
                        <svg viewBox="0 0 1440 40" className="absolute bottom-0 w-full" preserveAspectRatio="none">
                            <path d="M0,40 L0,20 Q360,0 720,20 Q1080,40 1440,20 L1440,40 Z" fill="#f8fafc" />
                        </svg>
                    </div>
                </header>

                {/* ── STICKY SEARCH BAR ────────────────────────────────────── */}
                <div className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                    <div className="max-w-6xl mx-auto px-6 py-3">
                        <form onSubmit={(e) => handleSearch(e, slug, searchInput, router)} className="flex items-center gap-3 max-w-lg">
                            <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2
                                            focus-within:ring-2 focus-within:ring-[#1e3a5f]/20 focus-within:border-[#1e3a5f] transition-all shadow-sm">
                                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Tìm bài viết trong ngành này..."
                                    value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                    className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent"
                                />
                                {searchInput && (
                                    <button type="button"
                                        onClick={() => { setSearchInput(''); router.push(`/blog-category/${slug}`); }}
                                        className="text-slate-400 hover:text-slate-600 transition-colors text-xs leading-none">
                                        ✕
                                    </button>
                                )}
                            </div>
                            <button type="submit"
                                className="px-4 py-2 bg-[#1e3a5f] text-white text-sm font-semibold rounded-lg hover:bg-[#162d4a] transition-colors shadow-sm">
                                Tìm kiếm
                            </button>
                        </form>

                        {currentSearch && (
                            <p className="text-xs text-slate-500 mt-2">
                                Kết quả cho <strong className="text-slate-700">"{currentSearch}"</strong> —{' '}
                                <span className="text-[#2563a8] font-semibold">{pagination?.total || 0} bài viết</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* ── BLOG GRID ────────────────────────────────────────────── */}
                <main className="max-w-6xl mx-auto px-6 py-10 md:py-14">
                    {blogs.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-xl border border-slate-100">
                            <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="font-bold text-slate-700 mb-1">Chưa có bài viết nào</p>
                            <p className="text-slate-400 text-sm">Hãy quay lại sau để xem nội dung mới nhất.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 fade-up">
                                {blogs.map((blog, i) => (
                                    <BlogCard key={blog.id} blog={blog} index={i} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <nav className="mt-14 flex justify-center items-center gap-2">
                                    <button
                                        onClick={() => handlePage(currentPage - 1, slug, currentSearch, router)}
                                        disabled={!pagination.hasPrevious}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600
                                                   disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Trước
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                            .filter(p => Math.abs(p - currentPage) <= 2)
                                            .map(p => (
                                                <button key={p} onClick={() => handlePage(p, slug, currentSearch, router)}
                                                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all shadow-sm
                                                        ${p === currentPage
                                                            ? 'bg-[#1e3a5f] text-white border border-[#1e3a5f]'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                                        }`}>
                                                    {p}
                                                </button>
                                            ))
                                        }
                                    </div>

                                    <button
                                        onClick={() => handlePage(currentPage + 1, slug, currentSearch, router)}
                                        disabled={!pagination.hasNext}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600
                                                   disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                                        Tiếp
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </nav>
                            )}
                        </>
                    )}
                </main>
            </div>
        </>
    );
}