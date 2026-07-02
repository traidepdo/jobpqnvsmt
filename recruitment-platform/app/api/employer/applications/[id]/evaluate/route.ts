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
    const response = await fetch('http://127.0.0.1:8000/api/evaluate-cv/', {
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
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Không thể kết nối máy chủ AI để chấm điểm CV.' },
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
