'use client';

import { useState } from 'react';
import type { Application } from '@/lib/types/candidate/Application';
import Header from './Header';
import Statsrow from './Statsrow';
import Filtertabs from './Filtertabs';
import Cancel from './Cancel';
import Content from './Content';
import { cancelApplication } from '@/lib/services/candidate/application';

export default function ApplicationsClient({
  initialApplications,
}: {
  initialApplications: Application[];
}) {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const handleCancelApplication = (id: string) => {
    setCancelTargetId(id);
  };

  const confirmCancelApplication = async () => {
    if (!cancelTargetId) return;
    const result = await cancelApplication(cancelTargetId);
    if (result.success) {
      setApplications(prev => prev.filter(app => app.id !== cancelTargetId));
      alert('Hủy ứng tuyển thành công!');
    } else {
      alert(result.error || 'Không thể hủy ứng tuyển. Vui lòng thử lại.');
    }
    setCancelTargetId(null);
  };

  const filtered = filterStatus
    ? applications.filter(a => a.status === filterStatus)
    : applications;

  return (
    <div className="min-h-screen bg-[#f4f6f5] pt-20 pb-16">
      <div className="max-w-[900px] mx-auto px-4 md:px-8">
        {/* Header */}
        <Header loading={false} applications={applications} />
        {/* Stats row */}
        <Statsrow applications={applications} loading={false} setFilterStatus={setFilterStatus} filterStatus={filterStatus} />
        {/* Filter tabs */}
        <Filtertabs applications={applications} loading={false} setFilterStatus={setFilterStatus} filterStatus={filterStatus} />
        {/* Content */}
        <Content
          filtered={filtered}
          filterStatus={filterStatus}
          loading={false}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          handleCancelApplication={handleCancelApplication}
        />
        {/* Cancel */}
        <Cancel
          cancelTargetId={cancelTargetId}
          setCancelTargetId={setCancelTargetId}
          confirmCancelApplication={confirmCancelApplication}
        />
      </div>
    </div>
  );
}
