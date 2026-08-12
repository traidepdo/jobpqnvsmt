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
    const djangoUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://severai-api.onrender.com';
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
      const errText = await response.text();
      let detailMsg = `Máy chủ AI phản hồi lỗi (${response.status}): ${errText}`;
      try {
        const jsonErr = JSON.parse(errText);
        if (jsonErr.error) detailMsg = jsonErr.error;
      } catch {}
      console.error("[Evaluate CV AI Error]:", detailMsg);
      return NextResponse.json(
        { error: detailMsg },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // 3. Return the score computed by Django
    return NextResponse.json({
      success: true,
      score: result.score,
    });
  } catch (error: any) {
    console.error('Error in evaluate endpoint:', error);
    return NextResponse.json(
      { error: 'Lỗi hệ thống khi kết nối đến dịch vụ chấm điểm AI.' },
      { status: 500 }
    );
  }
}
