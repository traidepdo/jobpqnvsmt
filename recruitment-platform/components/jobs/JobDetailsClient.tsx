'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import JobDetailHeader from './detail/JobDetailHeader';
import JobDetailTabs from './detail/JobDetailTabs';
import JobDetailSidebar from './detail/JobDetailSidebar';
import JobApplyModal from './detail/JobApplyModal';
import JobRelatedJobs from './detail/JobRelatedJobs';

export interface JobDetails {
  id: string;
  title: string;
  slug: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  type: string;
  experience: string | null;
  level: string | null;
  quantity: number;
  deadline: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    logo: string | null;
    website: string | null;
    description: string | null;
    size?: string | null;
    industry: string | null;
    addressDetail: string | null;
    ward?: { name: string } | null;
  };
  category: { name: string };
  ward: { name: string } | null;
  addressDetail: string | null;
  quizId: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface JobDetailsClientProps {
  job: JobDetails;
  relatedJobs: any[];
  salaryAnalysis: {
    predictedSalary: number;
    actualSalary: number | null;
    status: 'good' | 'average' | 'bad';
    percentageDiff: number;
    comparisonMessage: string;
  } | null;
  initialSaved: boolean;
  initialApplications: any[];
  userResumes: any[];
  user: any;
  isAuthenticated: boolean;
}

export default function JobDetailsClient({
  job,
  relatedJobs,
  salaryAnalysis,
  initialSaved,
  initialApplications,
  userResumes,
  user,
  isAuthenticated,
}: JobDetailsClientProps) {
  const router = useRouter();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [saveLoading, setSaveLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applications, setApplications] = useState<any[]>(initialApplications);

  const checkAplicated = () => {
    return applications.some((app: any) => app.jobId === job.id);
  };
  const userApplication = applications.find((app: any) => app.jobId === job.id);
  const isApplied = !!userApplication;
  const isPendingOrReviewing = userApplication?.status === 'PENDING' || userApplication?.status === 'REVIEWING';

  const handleApplyClick = () => {
    if (!user) {
      router.push(`/login?callbackUrl=/jobs/${job.slug}`);
      return;
    }
    if (user.role !== 'CANDIDATE') {
      alert('Tài khoản của bạn không phải là tài khoản ứng viên. Vui lòng đăng nhập tài khoản ứng viên để ứng tuyển.');
      return;
    }
    setShowApplyModal(true);
  };

  const handleToggleSave = async () => {
    if (!user) {
      router.push(`/login?callbackUrl=/jobs/${job.slug}`);
      return;
    }
    if (user.role !== 'CANDIDATE') {
      alert('Tài khoản của bạn không phải là tài khoản ứng viên. Vui lòng đăng nhập tài khoản ứng viên để lưu công việc.');
      return;
    }
    setSaveLoading(true);
    try {
      if (isSaved) {
        const res = await fetch(`/api/candidate/saved-jobs?jobId=${job.id}`, { method: 'DELETE' });
        if (res.status === 401 || res.status === 403) {
          router.push(`/login?callbackUrl=/jobs/${job.slug}`);
          return;
        }
        if (res.ok) {
          setIsSaved(false);
          router.refresh();
        }
      } else {
        const res = await fetch('/api/candidate/saved-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id }),
        });
        if (res.status === 401 || res.status === 403) {
          router.push(`/login?callbackUrl=/jobs/${job.slug}`);
          return;
        }
        if (res.ok) {
          setIsSaved(true);
          router.refresh();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelApplication = () => {
    setShowCancelModal(true);
  };

  const confirmCancelApplication = async () => {
    if (!userApplication) return;
    setApplyLoading(true);
    try {
      const res = await fetch(`/api/candidate/applications?id=${userApplication.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setApplications(prev => prev.filter((app: any) => app.id !== userApplication.id));
        setCancelSuccess(true);
        router.refresh();
        setTimeout(() => setCancelSuccess(false), 2000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể hủy ứng tuyển. Vui lòng thử lại.');
      }
    } catch (e) {
      console.error(e);
      alert('Đã xảy ra lỗi khi hủy ứng tuyển.');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleApplySuccess = (newApplication: any) => {
    setApplications(prev => [newApplication, ...prev]);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5] pb-20 pt-15">
      <JobDetailHeader
        job={job}
        salaryAnalysis={salaryAnalysis}
        isSaved={isSaved}
        saveLoading={saveLoading}
        isApplied={isApplied}
        isPendingOrReviewing={isPendingOrReviewing}
        applyLoading={applyLoading}
        onToggleSave={handleToggleSave}
        onApplyClick={handleApplyClick}
        onCancelClick={handleCancelApplication}
      />

      {/* ── Body ────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Left Column: Tabs & Location map */}
          <div className="lg:col-span-2">
            <JobDetailTabs job={job} />
          </div>

          {/* Right Column: Sidebar */}
          <div>
            <JobDetailSidebar
              job={job}
              isApplied={isApplied}
              isPendingOrReviewing={isPendingOrReviewing}
              applyLoading={applyLoading}
              onApplyClick={handleApplyClick}
              onCancelClick={handleCancelApplication}
            />
          </div>
        </div>

        {/* Related Jobs */}
        <JobRelatedJobs relatedJobs={relatedJobs} />
      </div>

      {/* Cancel Success Modal */}
      {cancelSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-100 text-center animate-[scaleUp_0.25s_ease]"
            style={{ animation: 'scaleUp 0.2s ease' }}>
            <style>{`@keyframes scaleUp { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>
            <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Hủy thành công</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Bạn đã hủy đơn ứng tuyển thành công.
            </p>
          </div>
        </div>
      )}

      {/* Cancel Confirm Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-100 animate-[slideUp_0.25s_ease]"
            style={{ animation: 'slideUp 0.2s ease' }}>
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-2">Hủy ứng tuyển</h3>
            <p className="text-xs text-gray-500 text-center mb-6 leading-relaxed">
              Bạn có chắc chắn muốn hủy đơn ứng tuyển cho công việc này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  confirmCancelApplication();
                }}
                disabled={applyLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      <JobApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        job={job}
        userResumes={userResumes}
        user={user}
        onApplySuccess={handleApplySuccess}
      />
    </div>
  );
}
