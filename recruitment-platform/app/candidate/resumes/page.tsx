import { getResume } from "@/lib/services/candidate/resume";
import { requireCandidate } from "@/lib/requireCandidate";
import { redirect } from "next/navigation";
import ClientResumes from "@/components/candidate/Resume/ClientResume";


export default async function CandidateResumesPage() {

  const auth = await requireCandidate();
  if (auth.error || !auth.payload) {
    redirect("/login");
  }

  const resume = await getResume(auth.payload?.id);

  return (
    <ClientResumes initialResumes={resume || []} />
  );
}
