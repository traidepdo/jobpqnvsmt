'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import JobForm, { JobFormValues } from '@/components/employer/JobForm';

export default function EmployerEditJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<Partial<JobFormValues>>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/employer/jobs/${id}`)
      .then(r => r.json())
      .then(d => {
        const j = d.job;
        if (j) {
          setInitial({
            title: j.title,
            description: j.description,
            requirements: j.requirements || '',
            benefits: j.benefits || '',
            quantity: String(j.quantity),
            salaryMin: j.salaryMin != null ? String(j.salaryMin < 100000 ? j.salaryMin * 1000000 : j.salaryMin) : '',
            salaryMax: j.salaryMax != null ? String(j.salaryMax < 100000 ? j.salaryMax * 1000000 : j.salaryMax) : '',
            wardId: j.wardId || '',
            addressDetail: j.addressDetail || '',
            type: j.type,
            experience: j.experience || '',
            level: j.level || '',
            deadline: j.deadline ? j.deadline.slice(0, 10) : '',
            categoryId: j.categoryId || j.category?.id || '',
            status: j.status,
            quizId: j.quizId || '',
            latitude: j.latitude != null ? String(j.latitude) : '',
            longitude: j.longitude != null ? String(j.longitude) : '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values: JobFormValues) => {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/employer/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const d = await res.json();
    setSaving(false);
    if (res.ok) router.push('/employer/jobs');
    else setError(d.error || 'Không thể cập nhật');
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#0052CC] rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
      {initial && <JobForm initial={initial} onSubmit={handleSubmit} submitLabel="Lưu thay đổi" loading={saving} />}
    </div>
  );
}
