import { NextRequest, NextResponse } from "next/server";
import { requireCandidate } from "@/lib/requireCandidate";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// CHECK TRẠNG THÁI FOLLOW
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireCandidate();
        if (auth.error) return NextResponse.json({ followed: false });

        const { id: companyId } = await params;
        const userId = auth.payload.id;

        const existing = await prisma.savedCompany.findUnique({
            where: { userId_companyId: { userId, companyId } }
        });

        return NextResponse.json({ followed: !!existing });
    } catch {
        return NextResponse.json({ followed: false });
    }
}

// TOGGLE FOLLOW / UNFOLLOW
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireCandidate();
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

        const { id: companyId } = await params;
        const userId = auth.payload.id;

        const existingFollow = await prisma.savedCompany.findUnique({
            where: { userId_companyId: { userId, companyId } }
        });

        if (existingFollow) {
            await prisma.savedCompany.delete({
                where: { userId_companyId: { userId, companyId } }
            });
            return NextResponse.json({ ok: true, followed: false, message: "Đã bỏ theo dõi" });
        } else {
            await prisma.savedCompany.create({
                data: { userId, companyId }
            });
            return NextResponse.json({ ok: true, followed: true, message: "Đã theo dõi công ty" });
        }
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}