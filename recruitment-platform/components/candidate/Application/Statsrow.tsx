import { ALL_STATUSES } from "@/lib/jobLabels"
import { Application } from "@/lib/types/candidate/Application"
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    PENDING: { label: 'Chờ xem xét', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400' },
    REVIEWING: { label: 'Đang xem xét', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
    INTERVIEW: { label: 'Phỏng vấn', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
    ACCEPTED: { label: 'Đã nhận', color: 'text-green-600', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
    REJECTED: { label: 'Không phù hợp', color: 'text-red-500', bg: 'bg-red-50 border-red-200', dot: 'bg-red-400' },
};
export default function Statsrow({ applications, loading, setFilterStatus, filterStatus }: { applications: Application[]; loading: boolean; setFilterStatus: (filterStatus: string) => void; filterStatus: string }) {
    const counts = ALL_STATUSES.slice(1).reduce<Record<string, number>>((acc, s) => {
        acc[s.value] = applications.filter(a => a.status === s.value).length;
        return acc;
    }, {});
    return (
        <>
            {!loading && applications.length > 0 && (
                <div className="grid grid-cols-5 gap-2.5 mb-5">
                    {ALL_STATUSES.slice(1).map(s => {
                        const cfg = STATUS_CONFIG[s.value];
                        return (
                            <button
                                key={s.value}
                                onClick={() => setFilterStatus(filterStatus === s.value ? '' : s.value)}
                                className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${filterStatus === s.value ? cfg.bg + ' ' + cfg.color : 'bg-white border-gray-100 hover:border-gray-200'
                                    }`}
                            >
                                <p className={`text-xl font-bold ${filterStatus === s.value ? cfg.color : 'text-gray-800'}`}>
                                    {counts[s.value] || 0}
                                </p>
                                <p className={`text-[11px] mt-0.5 ${filterStatus === s.value ? cfg.color : 'text-gray-500'}`}>
                                    {s.label}
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}
        </>
    )
}