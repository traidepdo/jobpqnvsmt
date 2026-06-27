import Link from "next/link"

interface CategoryItem {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
    _count?: {
        jobs: number;
    };
}

interface CategoryProps {
    categories: CategoryItem[];
}

export default function Category({ categories }: CategoryProps) {
    return (
        <section className="py-24 px-6 w-[1300px] mx-auto">
            <div className="flex items-end justify-between mb-12">
                <div>
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-green-600 mb-3" style={{ letterSpacing: '0.15em' }}>✦ Khám phá</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">Ngành nghề phổ biến</h2>
                    <p className="text-gray-500 mt-2 text-sm">Khám phá cơ hội theo lĩnh vực bạn yêu thích</p>
                </div>
                <Link href="/jobs" className="hidden sm:flex items-center gap-1.5 text-green-600 text-sm font-bold hover:text-green-700 transition-colors group">
                    Xem tất cả
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
                    </svg>
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((cat: CategoryItem, i: number) => (
                    <Link key={cat.id} href={`/jobs?category=${cat.slug}`}
                        className="cat-card-premium group relative block rounded-2xl p-5 cursor-pointer overflow-hidden"
                        style={{
                            background: 'rgba(255,255,255,0.9)',
                            border: '1px solid rgba(22,163,74,0.12)',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                            '--i': i,
                        } as React.CSSProperties}>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.04) 0%, rgba(74,222,128,0.06) 100%)' }} />
                        <div className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110" style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(34,197,94,0.15))' }}>
                            <span className="material-symbols-outlined text-2xl text-green-600">{cat.icon || 'work'}</span>
                        </div>
                        <div className="relative font-semibold text-gray-900 text-sm leading-snug mb-1.5 group-hover:text-green-700 transition-colors">{cat.name}</div>
                        <div className="relative text-xs text-gray-400 font-medium">{cat._count?.jobs ?? 0}+ việc làm</div>
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" style={{ background: 'linear-gradient(90deg, #16a34a, #4ade80)' }} />
                    </Link>
                ))}
            </div>
        </section>
    )
}