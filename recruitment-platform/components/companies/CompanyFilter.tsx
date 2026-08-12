'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Category } from '@/lib/types/category';

export default function CompanyFilter({
    initialSearch,
    initialIndustry,
    targetPath = '/companies',
    categories
}: {
    initialSearch: string;
    initialIndustry: string;
    targetPath?: string;
    categories: Category[];
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [searchInput, setSearchInput] = useState(initialSearch);

    const updateFilters = (newFilters: { industry?: string; search?: string; page?: string }) => {
        const params = new URLSearchParams(searchParams.toString());

        if (newFilters.industry !== undefined) {
            if (newFilters.industry) params.set('industry', newFilters.industry);
            else params.delete('industry');
            params.set('page', '1');
        }

        if (newFilters.search !== undefined) {
            if (newFilters.search) params.set('search', newFilters.search);
            else params.delete('search');
            params.set('page', '1');
        }

        if (newFilters.page !== undefined) {
            params.set('page', newFilters.page);
        }

        startTransition(() => {
            router.push(`${targetPath}?${params.toString()}`);
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilters({ search: searchInput });
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-4 mb-8">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00b14f] text-[20px] transition-colors duration-250">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Nhập tên công ty hoặc từ khóa..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full pl-11 pr-10 py-3 bg-gray-50/50 border border-gray-200/80 rounded-xl text-sm outline-none focus:border-[#00b14f] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,177,79,0.08)] transition-all duration-250 placeholder-gray-400"
                    />
                    {searchInput && (
                        <button
                            type="button"
                            onClick={() => { setSearchInput(''); updateFilters({ search: '' }); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px] block">close</span>
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-3 bg-[#00b14f] hover:bg-[#009241] text-white font-bold rounded-xl text-sm shadow-[0_4px_12px_rgba(0,177,79,0.15)] hover:shadow-[0_6px_16px_rgba(0,177,79,0.25)] flex items-center justify-center gap-1.5 transition-all duration-300 disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-[18px]">search</span>
                    <span>{isPending ? "Đang tìm..." : "Tìm kiếm"}</span>
                </button>
            </form>

            <div className="w-full md:w-72 relative">
                <select
                    value={initialIndustry}
                    onChange={(e) => updateFilters({ industry: e.target.value })}
                    disabled={isPending}
                    className="w-full pl-11 pr-3 py-3 bg-gray-50/50 border border-gray-200/80 rounded-xl text-sm outline-none focus:border-[#00b14f] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,177,79,0.08)] transition-all duration-250 cursor-pointer disabled:opacity-50 appearance-none"
                >
                    <option value="">Tất cả ngành nghề</option>
                    {categories.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>
                            {cat.name}
                        </option>
                    ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[18px]">
                    keyboard_arrow_down
                </span>
            </div>
        </div>
    );
}
