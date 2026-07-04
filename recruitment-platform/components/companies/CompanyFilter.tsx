'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Category } from '@prisma/client';

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
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 mb-6">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Nhập tên công ty cần tìm..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00b14f] focus:bg-white transition-all"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 bg-[#00b14f] text-white font-bold rounded-lg text-sm hover:bg-[#009940] transition-colors disabled:opacity-50"
                >
                    {isPending ? "Đang lọc..." : "Tìm kiếm"}
                </button>
            </form>

            <div className="w-full md:w-64">
                <select
                    value={initialIndustry}
                    onChange={(e) => updateFilters({ industry: e.target.value })}
                    disabled={isPending}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00b14f] focus:bg-white transition-all cursor-pointer disabled:opacity-50"
                >
                    <option value="">Tất cả</option>
                    {categories.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
