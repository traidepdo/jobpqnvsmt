import { requireEmployer } from '@/lib/requireEmployer';
import { redirect } from 'next/navigation';
import EmployerApplicationsClient from '@/components/employer/application/ClientApplication';
import { getApplications } from '@/lib/services/employer/Application';
export default async function EmployerApplicationsPage({ searchParams }: { searchParams: Promise<{ page?: string, search?: string, category?: string, status?: string, isVisible?: string, jobId?: string, query?: string }> }) {
  const auth = await requireEmployer();
  if (auth.error || !auth.payload?.id) {
    redirect('/employer/login');
  }

  const params = await searchParams;
  const search = params?.search || undefined;
  const page = params?.page ? parseInt(params.page) : 1;
  const category = params?.category || undefined;
  const status = params?.status || undefined;
  const isVisible = params?.isVisible || undefined;
  const jobId = params?.jobId || undefined;
  const query = params?.query || undefined;


  const { applications, pagination } = await getApplications({ employerId: auth.payload.id, search, page, category, status, isVisible, jobId, query });

  return <EmployerApplicationsClient applications={applications} pagination={pagination} searchParams={params} />;
}