"use server"
import { requireCandidate } from "@/lib/requireCandidate";
import { getInterviewsByCandidateId } from "@/server/services/candidate/interviews.services";

export async function authCandidate(): Promise<string> {
    const auth = await requireCandidate()
    if (auth.error || !auth.payload) {
        throw new Error("Unauthorized")
    }
    const id = auth.payload.id
    return id
}
export async function getInterviews() {
    const iduser = await authCandidate()
    const data = await getInterviewsByCandidateId.get(iduser)
    return data
}
