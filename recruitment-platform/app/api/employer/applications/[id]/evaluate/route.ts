import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';
import { signCloudinaryCvUrl } from '@/lib/cloudinarySign';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const { id } = await params;

  // 1. Verify the application belongs to the employer's company
  const application = await prisma.application.findFirst({
    where: {
      id,
      job: { companyId: auth.company.id }
    }
  });

  if (!application) {
    return NextResponse.json({ error: 'Không tìm thấy đơn ứng tuyển' }, { status: 404 });
  }

  try {
    // Sign the CV URL if it exists
    const signedCvUrl = application.cvUrl ? signCloudinaryCvUrl(application.cvUrl) : null;

    // 2. Call Django AI Server to evaluate
    const djangoUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${djangoUrl}/api/evaluate-cv/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || ""}`,
      },
      body: JSON.stringify({
        application_id: id,
        cv_url: signedCvUrl,
      }),
    });

    if (!response.ok) {
      console.warn(`SeverAI evaluate response not OK (${response.status}). Setting match score to 0.`);
      const fallbackScore = 0;
      await prisma.application.update({
        where: { id },
        data: { matchScore: fallbackScore }
      });
      return NextResponse.json({
        success: true,
        score: fallbackScore,
      });
    }

    const result = await response.json();
    const finalScore = typeof result.score === 'number' ? result.score : 0;
    await prisma.application.update({
      where: { id },
      data: { matchScore: finalScore }
    });

    return NextResponse.json({
      success: true,
      score: finalScore,
    });
  } catch (error: any) {
    console.error('Error in evaluate endpoint:', error);
    const fallbackScore = 0;
    try {
      await prisma.application.update({
        where: { id },
        data: { matchScore: fallbackScore }
      });
    } catch {}
    return NextResponse.json({
      success: true,
      score: fallbackScore,
    });
  }
}
