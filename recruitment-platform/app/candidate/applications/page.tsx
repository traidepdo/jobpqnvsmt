import { requireCandidate } from '@/lib/requireCandidate';
import { signCloudinaryCvUrl } from '@/lib/cloudinarySign';
import { redirect } from 'next/navigation';
import ApplicationsClient from '@/components/candidate/Application/ApplicationsClient';
import { getApplication } from '@/lib/services/candidate/application';

export default async function AppliedJobsPage() {
  const auth = await requireCandidate();
  if (auth.error || !auth.payload) {
    redirect('/login');
  }

  const applications = await getApplication(auth.payload.id);

  const signedApplications = applications.map(app => ({
    ...app,
    cvUrl: signCloudinaryCvUrl(app.cvUrl),
    createdAt: app.createdAt.toISOString(),
    job: {
      ...app.job,
      deadline: (app.job?.deadline as any) instanceof Date
        ? (app.job.deadline as any).toISOString()
        : (app.job?.deadline ? String(app.job.deadline) : null),
    }
  }));

  return <ApplicationsClient initialApplications={signedApplications as any} />;
}