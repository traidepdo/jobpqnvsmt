export function getJobTypeLabel(type?: string | null): string {
  if (!type) return '';
  const map: Record<string, string> = {
    FULL_TIME: 'Toàn thời gian',
    PART_TIME: 'Bán thời gian',
    CONTRACT: 'Hợp đồng',
    INTERNSHIP: 'Thực tập',
    REMOTE: 'Làm từ xa',
    FREELANCE: 'Freelance',
  };
  return map[type] || type;
}

export function getExperienceLabel(exp?: string | null): string {
  if (!exp) return 'Không yêu cầu';
  const map: Record<string, string> = {
    NO_EXPERIENCE: 'Không yêu cầu kinh nghiệm',
    UNDER_1_YEAR: 'Dưới 1 năm',
    ONE_TO_THREE_YEARS: '1 - 3 năm',
    THREE_TO_FIVE_YEARS: '3 - 5 năm',
    OVER_FIVE_YEARS: 'Trên 5 năm',
  };
  return map[exp] || exp;
}

export function getJobStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'Bản nháp',
    PENDING: 'Chờ duyệt',
    ACTIVE: 'Đang tuyển',
    CLOSED: 'Đã đóng',
    REJECTED: 'Bị từ chối',
  };
  return map[status] || status;
}

export function getApplicationStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Chờ xem xét',
    REVIEWING: 'Đang xem xét',
    ACCEPTED: 'Đã chấp nhận',
    REJECTED: 'Từ chối',
  };
  return map[status] || status;
}

export function formatDateVi(date: string | Date): string {
  return new Date(date).toLocaleDateString('vi-VN');
}
// lib/jobLabels.ts

export function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'Thỏa thuận';

  const fmt = (n: number): string => {
    const val = n < 100000 ? n * 1_000_000 : n;
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(val % 1_000_000_000 === 0 ? 0 : 1)} tỷ`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)} triệu`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(val % 1_000 === 0 ? 0 : 1)}k`;
    return val.toLocaleString('vi-VN');
  };

  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  if (max) return `Đến ${fmt(max)}`;
  return 'Thỏa thuận';
}