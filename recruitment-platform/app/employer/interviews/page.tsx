import { requireEmployer } from "@/lib/requireEmployer";
import { redirect } from "next/navigation";
import { GetDataAccepted, getInterviews, getjob } from "@/lib/services/employer/Interviews";
import ClientInterviews from "@/components/employer/interviews/ClientInterviews";

export const dynamic = 'force-dynamic';

export default async function EmployerInterviewsPage() {
    const auth = await requireEmployer();

    if (auth.error || !auth.company?.id) {
        redirect("/employer/login");
    }

    // Fetch accepted applications and interviews using companyId
    const companyId = auth.company.id;
    const listjob = await getjob(companyId);
    const allApps = await GetDataAccepted(companyId);
    const allInterviews = await getInterviews(companyId);
    // Filter out candidates who already have an interview scheduled from the pending list (on the server-side)
    const existingInterviewAppIds = new Set(allInterviews.map(iv => iv.application.id));
    const pendingApps = allApps.filter(app => !existingInterviewAppIds.has(app.applicationId));

    return (
        <ClientInterviews
            initialPendingApps={pendingApps}
            initialInterviews={allInterviews}
            initialJob={listjob}
        />
    );
}