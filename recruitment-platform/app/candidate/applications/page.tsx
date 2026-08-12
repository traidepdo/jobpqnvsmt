import { requireCandidate } from '@/lib/requireCandidate';
import { redirect } from 'next/navigation';
import ApplicationsClient from '@/components/candidate/Application/ApplicationsClient';
import { ApplicationService } from '@/server/services/candidate/application.services';

export default async function AppliedJobsPage() {
  const auth = await requireCandidate();
  if (auth.error || !auth.payload) {
    redirect('/login');
  }

  const applications = await ApplicationService.get(auth.payload.id);

  return <ApplicationsClient initialApplications={applications} />;
}