import { requireCandidate } from "@/lib/requireCandidate";
import { redirect } from "next/navigation";
import { getNotificationsServer } from "@/server/services/candidate/notification.services";
import ClientNotification from "@/components/candidate/Notification/ClientNotification";

export default async function NotificationsPage(params: Promise<{ search: string }>) {
    const auth = await requireCandidate();
    if (auth.error || !auth.payload) {
        redirect("/login");
    }
    const { search } = await params;
    const notificationsData = await getNotificationsServer(auth.payload.id, search);

    return (
        <ClientNotification initialNotifications={notificationsData.notifications} />
    );
}