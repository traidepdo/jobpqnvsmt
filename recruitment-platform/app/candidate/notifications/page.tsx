import { requireCandidate } from "@/lib/requireCandidate";
import { redirect } from "next/navigation";
import { getNotificationsServer } from "@/lib/services/candidate/notification";
import ClientNotification from "@/components/candidate/Notification/ClientNotification";

export default async function NotificationsPage() {
    const auth = await requireCandidate();
    if (auth.error || !auth.payload) {
        redirect("/login");
    }

    const notificationsData = await getNotificationsServer(auth.payload.id);

    return (
        <ClientNotification initialNotifications={notificationsData} />
    );
}