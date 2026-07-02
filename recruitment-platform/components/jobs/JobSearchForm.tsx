'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

interface Suggestion {
  id: string;
  title: string;
  type?: 'job' | 'company';
  slug?: string;
  logo?: string | null;
  size?: string | null;
  industry?: string | null;
  jobCount?: number;
}

const HOT_KEYWORDS: Record<string, Suggestion[]> = {
  'react': [
    { id: 'hot-1', title: 'React JS Developer (Frontend)' },
    { id: 'hot-2', title: 'React Native Mobile Developer' }
  ],
  'node': [
    { id: 'hot-3', title: 'NodeJS Backend Engineer' },
    { id: 'hot-4', title: 'Fullstack Developer (NodeJS/React)' }
  ],
  'ke toan': [
    { id: 'hot-5', title: 'Nhân viên Kế toán Tổng hợp' },
    { id: 'hot-6', title: 'Kế toán trưởng (Trưởng nhóm)' }
  ]
};

interface Ward {
  id: string;
  name: string;
}

export default function JobSearchForm({ 
  initialQuery, 
  initialLocation,
  wards = []
}: { 
  initialQuery: string; 
  initialLocation: string;
  wards?: Ward[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [locationInput, setLocationInput] = useState(initialLocation);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const clientCacheRef = useRef<Record<string, Suggestion[]>>({});

  const performSearch = (q: string, loc: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set('query', q);
    else params.delete('query');
    if (loc) params.set('location', loc);
    else params.delete('location');
    params.set('page', '1');
    setIsOpen(false);
    router.push(`/jobs?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(queryInput, locationInput);
  };

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete logic
  useEffect(() => {
    const trimmed = queryInput.toLowerCase().trim().replace(/\s+/g, ' ');

    if (!trimmed) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    // Only fetch suggestions if dropdown is open
    if (!isOpen) {
      return;
    }

    // 1. Kiểm tra Hot Keywords
    if (HOT_KEYWORDS[trimmed]) {
      setSuggestions(HOT_KEYWORDS[trimmed]);
      setIsOpen(true);
      setLoading(false);
      return;
    }

    // 2. Kiểm tra Client Cache
    if (clientCacheRef.current[trimmed]) {
      setSuggestions(clientCacheRef.current[trimmed]);
      setIsOpen(true);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: abortControllerRef.current?.signal
        });
        const data = await response.json();
        const results = data.suggestions || [];
        clientCacheRef.current[trimmed] = results;
        setSuggestions(results);
        
        // Double check focus/open state before showing dropdown
        if (document.activeElement === inputRef.current) {
          setIsOpen(true);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Fetch suggestions failed:', err);
        }
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(delayDebounceFn);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [queryInput, isOpen]);

  return (
    <div className="bg-white border-b border-gray-100 shadow-[0_1px_0_rgba(0,0,0,0.04)] sticky top-[60px] z-40">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-4">
        <form onSubmit={handleSearchSubmit}>
          <div className="flex gap-2.5">
            <div ref={containerRef} className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                value={queryInput}
                onChange={e => {
                  setQueryInput(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Tên công việc, vị trí, kỹ năng..."
                className="w-full h-11 pl-10 pr-10 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/10 transition bg-white"
              />
              {loading && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#00b14f] border-t-transparent rounded-full animate-spin"></div>
              )}

              {/* Autocomplete Suggestions Overlay */}
              {isOpen && suggestions.length > 0 && (
                <ul
                  className="absolute left-0 z-50 w-full mt-1.5 rounded-xl border border-gray-200 py-1.5 overflow-y-auto max-h-64 shadow-xl"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  {suggestions.map((item) => {
                    const isCompany = item.type === 'company';
                    return (
                      <li
                        key={item.id}
                        onClick={() => {
                          if (isCompany && item.slug) {
                            const params = new URLSearchParams(searchParams.toString());
                            params.set('company', item.slug);
                            params.delete('query');
                            if (locationInput) params.set('location', locationInput);
                            else params.delete('location');
                            params.set('page', '1');
                            setIsOpen(false);
                            router.push(`/jobs?${params.toString()}`);
                          } else {
                            setQueryInput(item.title);
                            performSearch(item.title, locationInput);
                          }
                        }}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer text-[13px] text-gray-700 hover:text-[#00b14f] transition-colors flex items-center justify-between gap-3 ${isCompany ? 'bg-slate-50/40 border-b border-slate-100/60' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {isCompany ? (
                            <div className="w-10 h-10 rounded-full bg-white border border-slate-100 p-1 flex-shrink-0 flex items-center justify-center shadow-sm">
                              {item.logo ? (
                                <img
                                  src={item.logo}
                                  alt={item.title}
                                  className="w-full h-full object-contain rounded-full"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-[18px] text-[#00b14f]">corporate_fare</span>
                              )}
                            </div>
                          ) : (
                            <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                              </svg>
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`line-clamp-1 ${isCompany ? 'font-bold text-slate-800 text-[14px]' : 'text-slate-700'}`}>
                                {item.title}
                              </span>
                              {isCompany && (
                                <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-bold uppercase shrink-0">
                                  Công ty
                                </span>
                              )}
                            </div>
                            
                            {isCompany && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
                                {item.industry && <span>{item.industry}</span>}
                                {item.industry && item.size && <span>•</span>}
                                {item.size && <span>Quy mô: {item.size}</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        {isCompany && typeof item.jobCount === 'number' && (
                          <span className="text-[11px] font-bold text-[#00b14f] bg-[#00b14f]/8 px-3 py-1 rounded-full shrink-0 border border-[#00b14f]/10 shadow-sm">
                            {item.jobCount} việc làm
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            
            <div className="w-[220px] relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <select
                value={locationInput}
                onChange={e => setLocationInput(e.target.value)}
                className="w-full h-11 pl-10 pr-8 border border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#00b14f] focus:ring-2 focus:ring-[#00b14f]/10 transition bg-white appearance-none cursor-pointer text-gray-700"
              >
                <option value="">Tất cả khu vực</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
              <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
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
