import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {

    try {
        const listjob = await prisma.job.findMany()
        if (listjob.length === 0) {
            return NextResponse.json({ error: "Jobs not found" }, { status: 404 });
        }
        return NextResponse.json(listjob);
    }
    catch (error) {
        console.error("Error getting jobs:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}