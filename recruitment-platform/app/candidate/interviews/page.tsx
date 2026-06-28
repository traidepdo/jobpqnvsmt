import { getInterviews } from "@/lib/services/candidate/interviews";
import { requireCandidate } from "@/lib/requireCandidate";
import ClientInterviews from "@/components/candidate/Interviews/ClientInterviews";
import { redirect } from "next/navigation";

export default async function Page() {
    const auth = await requireCandidate()
    if (auth.error || !auth.payload) redirect("/auth/login")
    const interviewsData = await getInterviews({ id: auth.payload.id });

    return <ClientInterviews interviewsData={interviewsData || []} />;
}
