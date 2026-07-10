'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Ward {
  id: string;
  name: string;
}

interface SearchBoxProps {
  wards?: Ward[];
}

interface Suggestion {
  id: string;
  title: string;
}

// 1. Khai báo Object cứng các từ khóa HOT để chặn tại client (tiết kiệm quota Upstash)
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

export function SearchBox({ wards = [] }: SearchBoxProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const clientCacheRef = useRef<Record<string, Suggestion[]>>({});

  const handleSearch = (queryOverride?: string) => {
    const queryToUse = queryOverride !== undefined ? queryOverride : searchQuery;
    const params = new URLSearchParams();
    if (queryToUse) params.append('query', queryToUse);
    if (selectedLocation) params.append('location', selectedLocation);
    setIsOpen(false);
    router.push(`/jobs?${params.toString()}`);
  };

  // Click outside listener to close dropdown
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

  // khi query thay đổi
  useEffect(() => {
    // chuyển hóa query thành chữ thường, xóa khoảng trắng đầu cuối và thay thế nhiều khoảng trắng liên tiếp bằng 1 khoảng trắng
    const trimmed = searchQuery.toLowerCase().trim().replace(/\s+/g, ' ');

    // nếu không có query thì không hiển thị suggestions
    if (!trimmed) {
      // xóa ds gợi ý
      setSuggestions([]);
      // đóng dropdown
      setIsOpen(false);
      // tắt loading
      setLoading(false);
      // return
      return;
    }

    // 1. Kiểm tra Hot Keywords ở Client
    if (HOT_KEYWORDS[trimmed]) {
      // set gợi ý
      setSuggestions(HOT_KEYWORDS[trimmed]);
      // mở dropdown
      setIsOpen(true);
      // tắt loading
      setLoading(false);
      // return
      return;
    }

    // 2. Kiểm tra bộ nhớ đệm tại trình duyệt (Client-side Cache)
    if (clientCacheRef.current[trimmed]) {
      // set gợi ý
      setSuggestions(clientCacheRef.current[trimmed]);
      // mở dropdown
      setIsOpen(true);
      // tắt loading
      setLoading(false);
      // return
      return;
    }

    // 1. Kiểm tra xem có Request cũ nào đang chạy hay không
    if (abortControllerRef.current) {
      // Nếu có, gọi hàm abort() để hủy ngay lập tức request đó ở phía trình duyệt
      abortControllerRef.current.abort();
    }
    // 2. Tạo một bộ điều khiển hủy mới cho Request sắp sửa gửi đi
    abortControllerRef.current = new AbortController();

    // Bật trạng thái loading
    setLoading(true);

    // Kỹ thuật Debounce 500ms
    const delayDebounceFn = setTimeout(async () => {
      try {
        // fetch data từ API
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          // đây là cách pass abort signal
          signal: abortControllerRef.current?.signal
        });
        const data = await response.json();
        // Lấy suggestions từ response
        const results = data.suggestions || [];

        // Lưu vào bộ nhớ đệm tại trình duyệt
        clientCacheRef.current[trimmed] = results;

        // set suggestions
        setSuggestions(results);
        // mở dropdown
        setIsOpen(true);
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
  }, [searchQuery]);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <div
        className="glass-input-green relative flex flex-col md:flex-row gap-2 p-2 rounded-2xl transition-all duration-300 w-full"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(34,197,94,0.25)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 flex-1 px-4 py-2.5" style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>
          <svg className="w-4 h-4 text-green-400/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setIsOpen(true)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Tên công việc, từ khóa..."
            className="w-full bg-transparent text-sm text-white placeholder-white/35 outline-none font-medium"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>

        {/* Location select */}
        <div className="flex items-center gap-3 px-4 py-2.5 min-w-[180px]">
          <svg className="w-4 h-4 text-green-400/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className={`w-full bg-transparent text-sm outline-none cursor-pointer ${selectedLocation ? 'text-white' : 'text-white/40'}`}
            style={{ colorScheme: 'dark' }}
          >
            <option value="" style={{ background: '#052e16' }}>Tất cả khu vực</option>
            {wards.length > 0 ? wards.map(w => (
              <option key={w.id} value={w.name} style={{ background: '#052e16' }}>{w.name}</option>
            )) : (
              <>
                <option value="Dương Đông" style={{ background: '#052e16' }}>Dương Đông</option>
                <option value="An Thới" style={{ background: '#052e16' }}>An Thới</option>
                <option value="Phú Quốc" style={{ background: '#052e16' }}>Phú Quốc (toàn đảo)</option>
              </>
            )}
          </select>
        </div>

        {/* Search button */}
        <button
          onClick={() => handleSearch()}
          className="shimmer-btn glow-btn text-white font-bold text-sm px-8 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' }}
        >
          Tìm việc ngay
        </button>
      </div>

      {/* Autocomplete Suggestions Overlay */}
      {isOpen && suggestions.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-2 rounded-2xl shadow-2xl max-h-64 overflow-y-auto border border-green-500/20 py-2 transition-all duration-200"
          style={{
            background: 'rgba(5, 46, 22, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          }}
        >
          {suggestions.map((item) => (
            <li
              key={item.id}
              onClick={() => {
                setSearchQuery(item.title);
                handleSearch(item.title);
              }}
              className="px-5 py-3 hover:bg-green-500/20 cursor-pointer text-sm text-gray-200 hover:text-green-300 transition-colors flex items-center gap-3"
            >
              <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span>{item.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
