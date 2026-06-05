'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import JobForm, { JobFormValues } from '@/components/employer/JobForm';

export default function EmployerNewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (values: JobFormValues) => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/employer/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const d = await res.json();
    setLoading(false);
    if (res.ok) {
      router.push('/employer/jobs');
    } else {
      setError(d.error || 'Không thể tạo tin');
    }
  };

  return (
    <div>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
      <JobForm onSubmit={handleSubmit} submitLabel="Đăng tin tuyển dụng" loading={loading} />
    </div>
  );
}
