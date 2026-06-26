import { requireCandidate } from '@/lib/requireCandidate';
import { redirect } from 'next/navigation';
import { createSavedJob } from '@/lib/services/candidate/savedjob';
import ClientSavedJob from '@/components/candidate/SavedJob/ClientSavedJob';

export default async function CandidateSavedPage() {
  const auth = await requireCandidate();
  if (auth.error || !auth.payload) {
    redirect('/login');
  }
  const data = await createSavedJob(auth.payload.id);

  // Chuẩn hóa Date thành String để truyền từ Server Component sang Client Component
  const initialItems = data.map(item => ({
    ...item,
    createdAt: (item.createdAt as any) instanceof Date 
      ? (item.createdAt as any).toISOString() 
      : String(item.createdAt),
    job: {
      ...item.job,
      deadline: (item.job?.deadline as any) instanceof Date 
        ? (item.job.deadline as any).toISOString() 
        : (item.job?.deadline ? String(item.job.deadline) : null),
    }
  }));

  return (
    <ClientSavedJob initialItems={initialItems} />
  );
}

