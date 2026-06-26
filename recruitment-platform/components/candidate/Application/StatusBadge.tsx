const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    PENDING: { label: 'Chờ xem xét', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
    REVIEWING: { label: 'Đang xem xét', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
    INTERVIEW: { label: 'Phỏng vấn', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
    ACCEPTED: { label: 'Đã nhận', color: 'text-green-600', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
    REJECTED: { label: 'Không phù hợp', color: 'text-red-500', bg: 'bg-red-50 border-red-200', dot: 'bg-red-400' },
};
export default function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', dot: 'bg-gray-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}