import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCandidate } from '@/lib/requireCandidate';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  const { id } = await params;

  const resume = await prisma.resume.findFirst({
    where: { id, userId: auth.payload.id },
    include: {
      template: { select: { id: true, name: true, slug: true } },
      user: { select: { name: true, email: true, phone: true, avatar: true } },
    },
  });

  if (!resume) {
    return NextResponse.json({ error: 'Không tìm thấy CV' }, { status: 404 });
  }

  return NextResponse.json({ resume });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const body = await req.json();
    const { title, address, summary, education, experience, projects, degree, languages, socialLinks, templateId, cvData, isDefault, fullName } = body;

    const existing = await prisma.resume.findFirst({
      where: { id, userId: auth.payload.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy CV' }, { status: 404 });
    }

    const avatarUrl = body.avatarUrl || cvData?._avatarUrl || existing.avatarUrl;

    let cleanCvData: Record<string, any> | null = null;
    if (cvData && typeof cvData === 'object') {
      const { _avatarUrl, ...rest } = cvData;
      cleanCvData = Object.keys(rest).length > 0 ? rest : null;
    }

    const finalFullName = fullName !== undefined ? fullName : (cvData?.name !== undefined ? cvData.name : undefined);

    let updated;
    if (isDefault) {
      await prisma.resume.updateMany({
        where: { userId: auth.payload.id },
        data: { isDefault: false },
      });
      updated = await prisma.resume.update({
        where: { id },
        data: {
          fullName: finalFullName !== undefined ? finalFullName : existing.fullName,
          title: title ? title.trim() : existing.title,
          address: address !== undefined ? address : existing.address,
          summary: summary !== undefined ? summary : existing.summary,
          education: education !== undefined ? (education ?? undefined) : (existing.education as any),
          experience: experience !== undefined ? (experience ?? undefined) : (existing.experience as any),
          projects: projects !== undefined ? (projects ?? undefined) : (existing.projects as any),
          degree: degree !== undefined ? degree : existing.degree,
          languages: languages !== undefined ? languages : existing.languages,
          socialLinks: socialLinks !== undefined ? (socialLinks ?? undefined) : (existing.socialLinks as any),
          templateId: templateId !== undefined ? templateId : existing.templateId,
          avatarUrl,
          cvData: cleanCvData !== undefined ? cleanCvData : (existing.cvData as any),
          isDefault: true,
        },
        include: {
          template: { select: { id: true, name: true, slug: true } },
        },
      });
    } else {
      updated = await prisma.resume.update({
        where: { id },
        data: {
          fullName: finalFullName !== undefined ? finalFullName : existing.fullName,
          title: title ? title.trim() : existing.title,
          address: address !== undefined ? address : existing.address,
          summary: summary !== undefined ? summary : existing.summary,
          education: education !== undefined ? (education ?? undefined) : (existing.education as any),
          experience: experience !== undefined ? (experience ?? undefined) : (existing.experience as any),
          projects: projects !== undefined ? (projects ?? undefined) : (existing.projects as any),
          degree: degree !== undefined ? degree : existing.degree,
          languages: languages !== undefined ? languages : existing.languages,
          socialLinks: socialLinks !== undefined ? (socialLinks ?? undefined) : (existing.socialLinks as any),
          templateId: templateId !== undefined ? templateId : existing.templateId,
          avatarUrl,
          cvData: cleanCvData !== undefined ? cleanCvData : (existing.cvData as any),
          isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
        },
        include: {
          template: { select: { id: true, name: true, slug: true } },
        },
      });
    }

    return NextResponse.json({ resume: updated });
  } catch (error) {
    console.error('Update resume error:', error);
    return NextResponse.json({ error: 'Không thể cập nhật CV' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireCandidate();
  if (auth.error) return auth.error;

  const { id } = await params;

  const existing = await prisma.resume.findFirst({
    where: { id, userId: auth.payload.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Không tìm thấy CV' }, { status: 404 });
  }

  await prisma.resume.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

