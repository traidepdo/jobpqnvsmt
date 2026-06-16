import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ applicationId: string }> }
) {
    const auth = await requireEmployer();
    if (auth.error) return auth.error;

    const { applicationId } = await params;

    // ── Debug: tách ra từng bước ─────────────────────────────
    const raw = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
            user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
            job: { select: { id: true, title: true, companyId: true } },
            interview: true,
        },
    });

    console.log('[DEBUG] applicationId :', applicationId);
    console.log('[DEBUG] auth.company.id:', auth.company.id);
    console.log('[DEBUG] found app      :', raw ? {
        id: raw.id,
        status: raw.status,
        jobCompanyId: raw.job.companyId,
        matchesCompany: raw.job.companyId === auth.company.id,
    } : 'NOT FOUND');
    // ─────────────────────────────────────────────────────────

    if (!raw) {
        return NextResponse.json({ error: 'Không tìm thấy đơn (id không tồn tại)' }, { status: 404 });
    }
    if (raw.job.companyId !== auth.company.id) {
        return NextResponse.json({
            error: `Đơn không thuộc công ty này`,
            debug: { jobCompanyId: raw.job.companyId, authCompanyId: auth.company.id },
        }, { status: 404 });
    }
    if (raw.status !== 'ACCEPTED') {
        return NextResponse.json({
            error: `Đơn chưa được duyệt`,
            debug: { status: raw.status },
        }, { status: 404 });
    }

    return NextResponse.json({
        candidate: raw.user,
        application: {
            id: raw.id,
            jobTitle: raw.job.title,
            jobId: raw.job.id,
            appliedAt: raw.createdAt,
            interview: raw.interview
                ? {
                    id: raw.interview.id,
                    scheduledAt: raw.interview.scheduledAt,
                    type: raw.interview.type,
                    location: raw.interview.location,
                    notes: raw.interview.notes,
                    status: raw.interview.status,
                    candidateStatus: raw.interview.candidateStatus,
                    declineReason: raw.interview.declineReason,
                }
                : null,
        },
    });
}