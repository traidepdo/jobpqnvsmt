'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function JobSearchForm({ initialQuery, initialLocation }: { initialQuery: string; initialLocation: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [locationInput, setLocationInput] = useState(initialLocation);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (queryInput) params.set('query', queryInput);
    else params.delete('query');
    if (locationInput) params.set('location', locationInput);
    else params.delete('location');
    params.set('page', '1');
    router.push(`/jobs?${params.toString()}`);
  };

  return (
    <div className="bg-white border-b border-gray-100 shadow-[0_1px_0_rgba(0,0,0,0.04)] sticky top-[60px] z-40">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-4">
        <form onSubmit={handleSearchSubmit}>
          <div className="flex gap-2.5">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={queryInput}
                onChange={e => setQueryInput(e.target.value)}
                placeholder="Tên công việc, vị trí, kỹ năng..."
                className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/10 transition bg-white"
              />
            </div>
            <div className="w-[220px] relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                value={locationInput}
                onChange={e => setLocationInput(e.target.value)}
                placeholder="Khu vực Phú Quốc"
                className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/10 transition bg-white"
              />
            </div>
            <button
              type="submit"
              className="h-11 px-7 bg-[#00b14f] hover:bg-[#009940] active:scale-95 text-white font-bold text-[14px] rounded-xl transition-all cursor-pointer shadow-sm shadow-green-200 whitespace-nowrap"
            >
              Tìm kiếm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
