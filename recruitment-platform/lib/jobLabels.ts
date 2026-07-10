import type { FilterTab } from "./types/employer/job";
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

export const ALL_STATUSES = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ xem xét', value: 'PENDING' },
  { label: 'Đang xem xét', value: 'REVIEWING' },
  { label: 'Phỏng vấn', value: 'INTERVIEW' },
  { label: 'Đã nhận', value: 'ACCEPTED' },
  { label: 'Không phù hợp', value: 'REJECTED' },
];



export const SALARY_OPTIONS = [
  { label: 'Tất cả mức lương', value: '' },
  { label: 'Dưới 10 triệu', value: 'lt10' },
  { label: '10 - 15 triệu', value: '10to15' },
  { label: '15 - 20 triệu', value: '15to20' },
  { label: '20 - 25 triệu', value: '20to25' },
  { label: '25 - 30 triệu', value: '25to30' },
  { label: '30 - 50 triệu', value: '30to50' },
  { label: 'Trên 50 triệu', value: 'gt50' },
  { label: 'Thỏa thuận', value: 'negotiable' },
];

export const EXPERIENCE_OPTIONS = [
  { label: 'Tất cả', value: '' },
  { label: 'Chưa có kinh nghiệm', value: 'NO_EXPERIENCE' },
  { label: 'Dưới 1 năm', value: 'UNDER_1_YEAR' },
  { label: '1 – 3 năm', value: 'ONE_TO_THREE_YEARS' },
  { label: '3 – 5 năm', value: 'THREE_TO_FIVE_YEARS' },
  { label: 'Trên 5 năm', value: 'OVER_FIVE_YEARS' },
];

export const TYPE_OPTIONS = [
  { label: 'Tất cả', value: '' },
  { label: 'Toàn thời gian', value: 'FULL_TIME' },
  { label: 'Bán thời gian', value: 'PART_TIME' },
  { label: 'Hợp đồng', value: 'CONTRACT' },
  { label: 'Thực tập', value: 'INTERNSHIP' },
];

export const LEVEL_OPTIONS = [
  { label: 'Tất cả', value: '' },
  { label: 'Intern / Thực tập sinh', value: 'INTERN' },
  { label: 'Fresher', value: 'FRESHER' },
  { label: 'Junior / Nhân viên', value: 'JUNIOR' },
  { label: 'Senior / Chuyên viên', value: 'SENIOR' },
  { label: 'Leader / Trưởng nhóm', value: 'LEADER' },
  { label: 'Manager / Quản lý', value: 'MANAGER' },
  { label: 'Director / Giám đốc', value: 'DIRECTOR' },
];

export const SORT_OPTIONS = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Lương từ thấp đến Cao', value: 'minsalary' },
  { label: 'Lương từ Cao đến Thấp', value: 'maxsalary' },
];
export const TABS: FilterTab[] = [
  { label: 'Tất cả' },
  { label: 'Đang hiển thị', status: 'ACTIVE' },
  { label: 'Hết hạn', status: 'EXPIRED' },
  { label: 'Chờ duyệt', status: 'PENDING' },
  { label: 'Bị từ chối', status: 'REJECTED' },
  { label: 'Nháp', status: 'DRAFT' },
  { label: 'Đã đóng', status: 'CLOSED' },
  { label: 'Bị admin ẩn', isVisible: 'false' },
];