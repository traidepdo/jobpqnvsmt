import { getInterviews } from "@/lib/services/candidate/interviews";
import { requireCandidate } from "@/lib/requireCandidate";
import ClientInterviews from "@/components/candidate/Interviews/ClientInterviews";
import { redirect } from "next/navigation";
import { Interview } from "@/lib/types/candidate/interviews";

interface PageProps {
    searchParams?: Promise<{ status?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
    const resolvedParams = searchParams ? await searchParams : undefined;
    const status = resolvedParams?.status || undefined;

    const auth = await requireCandidate();
    if (auth.error || !auth.payload) redirect("/auth/login");

    const interviewsData = await getInterviews({ id: auth.payload.id, status });

    return <ClientInterviews interviewsData={(interviewsData as unknown as Interview[]) || []} />;
}
