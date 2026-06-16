'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { JobDetails } from '@/components/jobs/JobDetailsClient';


const JobMapDisplay = dynamic(() => import('@/components/public/JobMapDisplay'), {
  ssr: false,
  loading: () => <div className="h-48 w-full bg-gray-50 border border-dashed rounded-xl flex items-center justify-center text-xs text-gray-400 mt-3">Đang tải bản đồ địa điểm...</div>
});

interface JobDetailTabsProps {
  job: JobDetails;
}

export default function JobDetailTabs({ job }: JobDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'requirements' | 'benefits'>('description');

  const tabs = [
    { key: 'description', label: 'Mô tả', show: !!job.description },
    { key: 'requirements', label: 'Yêu cầu', show: !!job.requirements },
    { key: 'benefits', label: 'Quyền lợi', show: !!job.benefits },
  ].filter(t => t.show);

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`tab-btn flex-1 py-3.5 text-sm font-semibold transition-colors cursor-pointer ${activeTab === tab.key
                ? 'text-[#00b14f] border-b-2 border-[#00b14f] bg-green-50/40'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 fade-in">
          {activeTab === 'description' && (
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          )}
          {activeTab === 'requirements' && job.requirements && (
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {job.requirements}
            </div>
          )}
          {activeTab === 'benefits' && job.benefits && (
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {job.benefits}
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#00b14f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          Địa điểm làm việc
        </h3>
        <p className="text-sm text-gray-600">
          {[job.addressDetail, job.ward?.name, 'Phú Quốc', 'Kiên Giang'].filter(Boolean).join(', ')}
        </p>
        {job.latitude !== null && job.longitude !== null && (
          <JobMapDisplay
            latitude={job.latitude}
            longitude={job.longitude}
            companyName={job.company.name}
            address={[job.addressDetail, job.ward?.name].filter(Boolean).join(', ')}
          />
        )}
      </div>
    </div>
  );
}
