// src/app/_components/Hero/SearchBox.js
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function SearchBox({ wards = [] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.append('query', searchQuery);
        if (selectedLocation) params.append('location', selectedLocation);
        router.push(`/jobs?${params.toString()}`);
    };

    return (
        <div
            className="glass-input-green relative flex flex-col md:flex-row gap-2 p-2 rounded-2xl max-w-2xl mx-auto transition-all duration-300"
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
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Tên công việc, từ khóa..."
                    className="w-full bg-transparent text-sm text-white placeholder-white/35 outline-none font-medium"
                />
            </div>

            {/* Location select */}
            <div className="flex items-center gap-3 px-4 py-2.5 min-w-[180px]">
                <svg className="w-4 h-4 text-green-400/70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
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
                onClick={handleSearch}
                className="shimmer-btn glow-btn text-white font-bold text-sm px-8 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' }}
            >
                Tìm việc ngay
            </button>
        </div>
    );
}