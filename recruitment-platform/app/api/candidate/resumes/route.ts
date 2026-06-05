import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCandidate } from '@/lib/requireCandidate';

export async function GET() {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  const resumes = await prisma.resume.findMany({
    where: { userId: auth.payload.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      address: true,
      summary: true,
      education: true,
      experience: true,
      avatarUrl: true,
      cvData: true,
      createdAt: true,
      updatedAt: true,
      template: { select: { id: true, name: true, slug: true, thumbnailUrl: true } },
      _count: { select: { applications: true } },
    },
  });

  return NextResponse.json({ resumes });
}

export async function POST(req: Request) {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { title, address, summary, education, experience, projects, degree, languages, socialLinks, templateId, cvData } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập tên hồ sơ' }, { status: 400 });
    }

    // Lấy avatarUrl từ body hoặc từ cvData._avatarUrl (fallback)
    const avatarUrl = body.avatarUrl || cvData?._avatarUrl || null;

    // Xóa _avatarUrl khỏi cvData trước khi lưu
    let cleanCvData: Record<string, any> | null = null;
    if (cvData && typeof cvData === 'object') {
      const { _avatarUrl, ...rest } = cvData;
      // Giữ lại dù rest rỗng — dùng null thay vì undefined để Prisma lưu đúng
      cleanCvData = Object.keys(rest).length > 0 ? rest : null;
    }

    const resume = await prisma.resume.create({
      data: {
        userId: auth.payload.id,
        title: title.trim(),
        address: address || null,
        summary: summary || null,
        education: education ?? undefined,
        experience: experience ?? undefined,
        projects: projects ?? undefined,
        degree: degree || null,
        languages: languages || null,
        socialLinks: socialLinks ?? undefined,
        templateId: templateId || null,
        avatarUrl,               // URL Cloudinary thật
        cvData: cleanCvData ?? undefined, // không có _avatarUrl
      },
      include: {
        template: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ resume }, { status: 201 });
  } catch (error) {
    console.error('Create resume error:', error);
    return NextResponse.json({ error: 'Không thể lưu CV' }, { status: 500 });
  }
}