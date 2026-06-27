import { requireCandidate } from "@/lib/requireCandidate";
import { getNotificationsServer } from "@/lib/services/candidate/notification";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const auth = await requireCandidate();
    if (auth.error) return auth.error;
    const user = auth.payload;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;

    const notifications = await getNotificationsServer(user.id, search);

    return NextResponse.json({ notifications });
}