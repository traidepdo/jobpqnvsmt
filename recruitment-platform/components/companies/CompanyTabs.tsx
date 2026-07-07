'use client';

import React, { useState, useEffect } from 'react';

interface CompanyTabsProps {
  hasImages: boolean;
  hasJobs: boolean;
}

export default function CompanyTabs({ hasImages, hasJobs }: CompanyTabsProps) {
  const [activeTab, setActiveTab] = useState('intro');

  const tabs = [
    { id: 'intro', label: 'Giới thiệu' },
    ...(hasImages ? [{ id: 'photos', label: 'Hình ảnh hoạt động' }] : []),
    ...(hasJobs ? [{ id: 'jobs', label: 'Tin tuyển dụng' }] : []),
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 160; // Offset for sticky headers

      for (const tab of tabs) {
        const element = document.getElementById(tab.id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveTab(tab.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount to set initial active tab
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasImages, hasJobs]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.offsetTop - 120; // Scroll offset
      window.scrollTo({
        top,
        behavior: 'smooth',
      });
      setActiveTab(id);
    }
  };

  return (
    <div className="sticky top-[64px] z-30 bg-white/95 backdrop-blur border-b border-slate-100 px-8 py-3.5 flex gap-6 overflow-x-auto scrollbar-none transition-all duration-300">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => scrollToSection(tab.id)}
          className={`text-sm font-bold pb-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === tab.id
              ? 'text-[#00b14f] border-[#00b14f]'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
