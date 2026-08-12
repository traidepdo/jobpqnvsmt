'use client';
import { BlogPost } from "@/lib/types/blogs/blogcategory.type";

export function BlogCard({ blog, index }: { blog: BlogPost; index: number }) {
    const isFeatured = index === 0;
    return (
        <article className={`group relative bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-[#1e3a5f]/30 hover:shadow-[0_8px_32px_rgba(30,58,95,0.10)] transition-all duration-300 flex flex-col ${isFeatured ? 'md:col-span-2 md:flex-row' : ''}`} style={{ animationDelay: `${index * 70}ms` }}>
            {/* Thumbnail */}
            <div className={`overflow-hidden bg-slate-100 relative shrink-0 ${isFeatured ? 'md:w-[45%] h-56 md:h-auto' : 'h-48 w-full'}`}>
                <img
                    src={blog.thumbnail || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800"}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f2340]/30 via-transparent to-transparent" />
                {isFeatured && (
                    <span className="absolute top-4 left-4 bg-[#1e3a5f] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded">
                        Bài nổi bật
                    </span>
                )}
            </div>

            {/* Content */}
            <div className={`flex flex-col flex-1 p-5 ${isFeatured ? 'md:p-8 md:justify-center' : ''}`}>
                {blog.tags && blog.tags.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                        {blog.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-[#2563a8] bg-blue-50 px-2 py-0.5 rounded">
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}

                <h2 className={`font-semibold leading-snug text-[#0f2340] group-hover:text-[#2563a8] transition-colors mb-2.5 line-clamp-2
                               ${isFeatured ? 'text-xl md:text-2xl' : 'text-base'}`}>
                    <a href={`/blogs/${blog.slug}`} className="stretched-link">{blog.title}</a>
                </h2>

                <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-5 flex-1">
                    {blog.excerpt}
                </p>

                <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                    <div className="flex items-center gap-2">
                        <img
                            src={blog.author?.avatar || "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=150"}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover ring-2 ring-slate-100"
                        />
                        <span className="text-xs font-semibold text-slate-700">{blog.author?.name || "Ban Biên Tập"}</span>
                    </div>
                    <time className="text-[11px] text-slate-400 tabular-nums">
                        {new Date(blog.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" })}
                    </time>
                </div>
            </div>
        </article>
    );
}