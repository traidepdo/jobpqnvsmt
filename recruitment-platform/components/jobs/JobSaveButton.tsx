'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { delectSaveJobAction, saveJobAction } from '@/server/actions/candidate/savejob.action';
interface JobSaveButtonProps {
  jobId: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
}

export default function JobSaveButton({ jobId, initialSaved, isLoggedIn }: JobSaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/jobs`);
      return;
    }
    setLoading(true);
    try {
      if (saved) {
        const res = await delectSaveJobAction(jobId);
        if (!res.success) {
          router.push(`/login?callbackUrl=/jobs`);
          return;
        }
        setSaved(false);
      } else {
        const res = await saveJobAction(jobId);
        if (!res.success) {
          router.push(`/login?callbackUrl=/jobs`);
          return;
        }
        setSaved(true);
      }
    }
    catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleSave}
      disabled={loading}
      className={`absolute top-3.5 right-3.5 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 ${saved ? 'text-[#00b14f] bg-[#00b14f]/10' : 'text-gray-300 hover:text-[#00b14f] hover:bg-[#00b14f]/10'
        }`}
      title={saved ? 'Bỏ lưu' : 'Lưu việc làm'}
    >
      <svg className="w-3.5 h-3.5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    </button>
  );
}
