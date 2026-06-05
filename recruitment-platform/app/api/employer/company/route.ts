import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer } from '@/lib/requireEmployer';
import { CompanySize } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const SIZE_LABELS: Record<string, string> = {
  SMALL: '1 - 50 nhân viên',
  MEDIUM: '51 - 200 nhân viên',
  LARGE: '201 - 500 nhân viên',
  ENTERPRISE: '500+ nhân viên',
};

const VALID_SIZES: CompanySize[] = ['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'];

// ── Lưu ảnh vào public/uploads/logos/ ────────────────────────────────────────
// ── Upload logo lên Cloudinary ────────────────────────────────────────
async function saveLogoToCloudinary(base64DataUrl: string, companyId: string): Promise<string> {
  const matches = base64DataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) throw new Error('Định dạng ảnh không hợp lệ');

  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Giới hạn 5MB
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Ảnh quá lớn, vui lòng chọn ảnh dưới 5MB');
  }

  const result = await cloudinary.uploader.upload(base64DataUrl, {
    folder: 'company-logos',
    transformation: [
      { width: 500, height: 500, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  return result.secure_url;
}

function isBase64DataUrl(value: string): boolean {
  return value.startsWith('data:image/');
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  const row = await prisma.company.findUnique({
    where: { id: auth.company.id },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      website: true,
      description: true,
      industry: true,
      addressDetail: true,
      wardId: true,
      size: true,
      isApproved: true,
      isActive: true,
      ward: { select: { id: true, name: true } },
      _count: { select: { jobs: true } },
    },
  });

  const company = row
    ? { ...row, sizeLabel: row.size ? SIZE_LABELS[row.size] ?? row.size : null }
    : null;

  return NextResponse.json({ company });
}

// ── PUT ───────────────────────────────────────────────────────────────────────
export async function PUT(req: Request) {
  const auth = await requireEmployer();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { name, logo, website, description, industry, addressDetail, wardId, size } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Tên công ty là bắt buộc' }, { status: 400 });
    }

    // ── Resolve logo ──────────────────────────────────────────────────────────
    let resolvedLogo: string | null = null;

    if (logo) {
      if (isBase64DataUrl(logo)) {
        // Ảnh tải lên từ máy → lưu vào public/uploads/logos/
        try {
          resolvedLogo = await saveLogoToCloudinary(logo, auth.company.id);
        } catch (err: any) {
          return NextResponse.json({ error: err.message || 'Không thể lưu ảnh' }, { status: 400 });
        }
      } else if (isValidHttpUrl(logo)) {
        // URL bình thường → lưu thẳng
        resolvedLogo = logo;
      } else {
        return NextResponse.json(
          { error: 'Logo không hợp lệ (phải là URL hoặc ảnh tải lên)' },
          { status: 400 },
        );
      }
    }

    // ── Company size ──────────────────────────────────────────────────────────
    let companySize: CompanySize | null = null;
    if (size && VALID_SIZES.includes(size)) {
      companySize = size;
    }

    // ── DB update ─────────────────────────────────────────────────────────────
    const company = await prisma.company.update({
      where: { id: auth.company.id },
      data: {
        name: name.trim(),
        logo: resolvedLogo,
        website: website || null,
        description: description || null,
        industry: industry || null,
        addressDetail: addressDetail || null,
        wardId: wardId || null,
        size: companySize,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        website: true,
        description: true,
        industry: true,
        addressDetail: true,
        wardId: true,
        isApproved: true,
        ward: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Update company error:', error);
    return NextResponse.json({ error: 'Không thể cập nhật công ty' }, { status: 500 });
  }
}