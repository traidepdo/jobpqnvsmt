'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatSalary } from '@/lib/jobLabels';

interface JobRelatedJobsProps {
  jobId: string;
  slug: string;
  initialJobs?: any[];
}

const getJobTypeLabel = (type?: string) => {
  switch (type) {
    case 'FULL_TIME': return 'Toàn thời gian';
    case 'PART_TIME': return 'Bán thời gian';
    case 'CONTRACT': return 'Hợp đồng';
    case 'INTERNSHIP': return 'Thực tập';
    case 'REMOTE': return 'Từ xa';
    default: return type || '';
  }
};

export default function JobRelatedJobs({ jobId, slug, initialJobs = [] }: JobRelatedJobsProps) {
  const [jobs, setJobs] = useState<any[]>(initialJobs);
  const [loading, setLoading] = useState<boolean>(initialJobs.length === 0);

  useEffect(() => {
    let isMounted = true;
    async function loadSeverAIRecommendations() {
      try {
        const res = await fetch(`/api/public/jobs/${slug}/recommend`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setJobs(data);
          }
        }
      } catch (err) {
        console.error("Error loading SeverAI recommendations on client:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSeverAIRecommendations();
    return () => { isMounted = false; };
  }, [slug]);

  return (
    <div className="border-t border-gray-150 pt-8 mt-8">
      <h2 className="text-base font-bold text-gray-950 mb-5 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#00b14f]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Việc làm liên quan dành cho bạn
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 h-24 flex gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">Chưa có công việc tương tự nào khác.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((item: any) => (
            <Link
              href={`/jobs/${item.slug}`}
              key={item.id}
              className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#00b14f] transition-all duration-300 hover:shadow-sm flex gap-4 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {item.company?.logo ? (
                  <img src={item.company.logo} alt={item.company.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="text-xl">🏢</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-gray-900 truncate mb-0.5 hover:text-[#00b14f] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs font-semibold text-gray-400 truncate mb-2">{item.company?.name}</p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="bg-[#f4f7f5] px-2 py-0.5 rounded text-gray-600 font-medium">
                    {formatSalary(item.salaryMin, item.salaryMax)}
                  </span>
                  <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium">
                    {getJobTypeLabel(item.type)}
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                    {item.ward?.name || item.addressDetail || 'Phú Quốc'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
