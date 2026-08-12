'use client';

import React from 'react';
import { useJobsLoading } from './JobsLoadingContext';

export default function JobListWrapper({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const { isPending } = useJobsLoading();

  if (isPending) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
