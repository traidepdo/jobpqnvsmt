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

async function saveCoverImageToCloudinary(base64DataUrl: string, companyId: string): Promise<string> {
  const matches = base64DataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) throw new Error('Định dạng ảnh bìa không hợp lệ');

  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Ảnh quá lớn, vui lòng chọn ảnh dưới 5MB');
  }

  const result = await cloudinary.uploader.upload(base64DataUrl, {
    folder: 'company-covers',
    transformation: [
      { width: 1200, height: 400, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  return result.secure_url;
}

async function savePhotoToCloudinary(base64DataUrl: string, companyId: string): Promise<string> {
  const matches = base64DataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) throw new Error('Định dạng ảnh không hợp lệ');

  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Ảnh quá lớn, vui lòng chọn ảnh dưới 5MB');
  }

  const result = await cloudinary.uploader.upload(base64DataUrl, {
    folder: 'company-photos',
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' },
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

function extractPublicId(url: string): string | null {
  const parts = url.split('/image/upload/');
  if (parts.length < 2) return null;

  const pathParts = parts[1].split('/');
  if (pathParts[0].match(/^v\d+$/)) {
    pathParts.shift();
  }

  const pathWithExtension = pathParts.join('/');
  const lastDotIdx = pathWithExtension.lastIndexOf('.');
  if (lastDotIdx === -1) return pathWithExtension;
  return pathWithExtension.substring(0, lastDotIdx);
}

async function deleteFromCloudinary(url: string) {
  try {
    if (!url || !url.includes('res.cloudinary.com')) return;
    const publicId = extractPublicId(url);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (err) {
    console.error('Failed to delete image from Cloudinary:', err);
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
      coverImage: true,
      images: true,
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
    const { name, logo, coverImage, images, website, description, industry, addressDetail, wardId, size } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Tên công ty là bắt buộc' }, { status: 400 });
    }

    // Fetch old company data to check for deleted/replaced images
    const oldCompany = await prisma.company.findUnique({
      where: { id: auth.company.id },
      select: { logo: true, coverImage: true, images: true }
    });

    // ── Resolve logo ──────────────────────────────────────────────────────────
    let resolvedLogo: string | null = null;

    if (logo) {
      if (isBase64DataUrl(logo)) {
        try {
          resolvedLogo = await saveLogoToCloudinary(logo, auth.company.id);
        } catch (err: any) {
          return NextResponse.json({ error: err.message || 'Không thể lưu logo' }, { status: 400 });
        }
      } else if (isValidHttpUrl(logo)) {
        resolvedLogo = logo;
      } else {
        return NextResponse.json(
          { error: 'Logo không hợp lệ (phải là URL hoặc ảnh tải lên)' },
          { status: 400 },
        );
      }
    }

    // ── Resolve coverImage ────────────────────────────────────────────────────
    let resolvedCoverImage: string | null = null;

    if (coverImage) {
      if (isBase64DataUrl(coverImage)) {
        try {
          resolvedCoverImage = await saveCoverImageToCloudinary(coverImage, auth.company.id);
        } catch (err: any) {
          return NextResponse.json({ error: err.message || 'Không thể lưu ảnh bìa' }, { status: 400 });
        }
      } else if (isValidHttpUrl(coverImage)) {
        resolvedCoverImage = coverImage;
      } else {
        return NextResponse.json(
          { error: 'Ảnh bìa không hợp lệ (phải là URL hoặc ảnh tải lên)' },
          { status: 400 },
        );
      }
    }

    // ── Resolve images ────────────────────────────────────────────────────────
    let resolvedImages: string[] = [];

    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (!img) continue;
        if (isBase64DataUrl(img)) {
          try {
            const uploadedUrl = await savePhotoToCloudinary(img, auth.company.id);
            resolvedImages.push(uploadedUrl);
          } catch (err: any) {
            return NextResponse.json({ error: err.message || 'Không thể lưu ảnh công ty' }, { status: 400 });
          }
        } else if (isValidHttpUrl(img)) {
          resolvedImages.push(img);
        } else {
          return NextResponse.json(
            { error: 'Ảnh công ty không hợp lệ' },
            { status: 400 },
          );
        }
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
        coverImage: resolvedCoverImage,
        images: resolvedImages,
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
        coverImage: true,
        images: true,
        website: true,
        description: true,
        industry: true,
        addressDetail: true,
        wardId: true,
        isApproved: true,
        ward: { select: { id: true, name: true } },
      },
    });

    // ── Cleanup old images from Cloudinary ────────────────────────────────────
    if (oldCompany) {
      if (oldCompany.logo && oldCompany.logo !== resolvedLogo) {
        await deleteFromCloudinary(oldCompany.logo);
      }
      if (oldCompany.coverImage && oldCompany.coverImage !== resolvedCoverImage) {
        await deleteFromCloudinary(oldCompany.coverImage);
      }
      const oldPhotos = Array.isArray(oldCompany.images) ? (oldCompany.images as string[]) : [];
      for (const oldPhoto of oldPhotos) {
        if (!resolvedImages.includes(oldPhoto)) {
          await deleteFromCloudinary(oldPhoto);
        }
      }
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Update company error:', error);
    return NextResponse.json({ error: 'Không thể cập nhật công ty' }, { status: 500 });
  }
}