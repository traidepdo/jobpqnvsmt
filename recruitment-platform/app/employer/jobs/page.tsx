import { requireEmployer } from "@/lib/requireEmployer";
import { redirect } from "next/navigation";
import EmployerJobsClient from "@/components/employer/job/ClientJob";
import { getJobs, getCategories } from "@/lib/services/employer/Job";

export default async function EmployerJobsPage({ searchParams }: { searchParams: Promise<{ page?: string; limit?: string, status?: string, isVisible?: string, search?: string, category?: string }> }) {
  const auth = await requireEmployer();
  if (auth.error || !auth.payload?.id) {
    redirect("/employer/login");
  }
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = Number(resolvedParams.limit) || 12;
  const status = typeof resolvedParams.status === 'string' ? resolvedParams.status : undefined;
  const isVisible = typeof resolvedParams.isVisible === 'string' ? resolvedParams.isVisible : undefined;
  const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : undefined;
  const category = typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined;
  const { jobs, pagination } = await getJobs(auth.payload.id, status, isVisible, page, limit, search, category);
  const categories = await getCategories();
  return (
    <EmployerJobsClient jobsData={jobs} paginationData={pagination} categories={categories} />
  )
}