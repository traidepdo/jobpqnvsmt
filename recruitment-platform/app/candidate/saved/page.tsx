import { requireCandidate } from '@/lib/requireCandidate';
import { redirect } from 'next/navigation';
import { createSavedJob } from '@/lib/services/candidate/savedjob';
import ClientSavedJob from '@/components/candidate/SavedJob/ClientSavedJob';
interface PageProps {
  searchParams: Promise<{ page?: string; limit?: string; query?: string }>;
}
export default async function CandidateSavedPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = Number(resolvedParams.limit) || 12;
  const query = resolvedParams.query || undefined;

  const auth = await requireCandidate();
  if (auth.error || !auth.payload) {
    redirect('/login');
  }
  const { items, total } = await createSavedJob(auth.payload.id, { page, limit, query });

  // Chuẩn hóa Date thành String để truyền từ Server Component sang Client Component
  const initialItems = items.map(item => ({
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
    <ClientSavedJob
      initialItems={initialItems}
      metadata={{
        total,
        page,
        limit,
        query,
        totalPages: Math.ceil(total / limit)
      }}
    />
  );
}

