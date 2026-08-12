'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface JobsLoadingContextType {
  isPending: boolean;
  setIsPending: (pending: boolean) => void;
}

const JobsLoadingContext = createContext<JobsLoadingContextType>({
  isPending: false,
  setIsPending: () => {},
});

export function JobsLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isPending, setIsPending] = useState(false);
  const searchParams = useSearchParams();

  // Reset loading state when searchParams changes (meaning navigation completed)
  useEffect(() => {
    setIsPending(false);
  }, [searchParams]);

  // Global link click interceptor to catch any <Link> clicks for sorting/paging
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (target && target.tagName === 'A') {
        const href = target.getAttribute('href');
        if (href && (href.startsWith('/jobs') || href.startsWith('?'))) {
          setIsPending(true);
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  return (
    <JobsLoadingContext.Provider value={{ isPending, setIsPending }}>
      {children}
    </JobsLoadingContext.Provider>
  );
}

export const useJobsLoading = () => useContext(JobsLoadingContext);
