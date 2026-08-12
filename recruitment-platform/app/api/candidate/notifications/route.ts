import { requireCandidate } from "@/lib/requireCandidate";
import { NextResponse } from "next/server";
import { getNotificationsServer } from "@/server/services/candidate/notification.services";

export async function GET(request: Request) {
    const auth = await requireCandidate();
    if (auth.error) return auth.error;
    const user = auth.payload;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;

    const notifications = await getNotificationsServer(user.id, search);

    return NextResponse.json({ notifications });
}