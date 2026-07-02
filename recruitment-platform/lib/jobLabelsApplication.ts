export const getStatusActions = (current: string): string[] => {
    const map: Record<string, string[]> = {
        PENDING: ['REVIEWING', 'ACCEPTED', 'REJECTED'],
        REVIEWING: ['ACCEPTED', 'REJECTED'],
        ACCEPTED: ['REJECTED'],    // chỉ có thể từ chối
        REJECTED: ['REVIEWING'],   // chỉ có thể xem xét lại, KHÔNG có ACCEPTED
    };
    return map[current] ?? [];
};
export const statusStyle: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    REVIEWING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ACCEPTED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
};
export const actionBtnStyle: Record<string, string> = {
    REVIEWING: 'border-indigo-200 text-indigo-700 hover:bg-indigo-50',
    ACCEPTED: 'bg-green-500 hover:bg-green-600 text-white border-green-500',
    REJECTED: 'border-red-200 text-red-600 hover:bg-red-50',
    PENDING: 'border-amber-200 text-amber-700 hover:bg-amber-50',
};

export const actionLabel: Record<string, string> = {
    REVIEWING: 'Xem xét lại',
    ACCEPTED: 'Chấp nhận',
    REJECTED: 'Từ chối',
    PENDING: 'Chuyển về chờ',
};
