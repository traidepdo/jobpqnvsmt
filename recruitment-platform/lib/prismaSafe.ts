/** Company fields an toàn — tránh lỗi enum `size` rỗng trong DB cũ */
export const companyPublicSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  website: true,
  description: true,
  industry: true,
  size: true,
  addressDetail: true,
  ward: { select: { name: true, slug: true } },
} as const;

export const companyCardSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
} as const;

/** Sửa bản ghi company có size enum không hợp lệ (chuỗi rỗng) */
export async function fixInvalidCompanySize(prisma: {
  $executeRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<number>;
}) {
  try {
    await prisma.$executeRaw`UPDATE companies SET size = NULL WHERE size = ''`;
  } catch {
    // Bỏ qua nếu DB/provider không hỗ trợ
  }
}
