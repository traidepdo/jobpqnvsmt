import { requireCandidate } from "@/lib/requireCandidate";
import { redirect } from "next/navigation";
import { getDataProfile } from "@/lib/services/candidate/profile";
import { User } from "@/lib/types/candidate/profile";
import ClientProfile from "@/components/candidate/ProfileUser/ClientProfile";

export default async function Page() {
    const auth = await requireCandidate();
    if (auth.error || !auth.payload?.id) return redirect("/dang-nhap");
    const dataprofile: { user: User } = await getDataProfile(auth.payload.id);
    return (
        <ClientProfile user={dataprofile.user} />
    )
}