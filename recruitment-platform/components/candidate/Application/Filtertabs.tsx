import { ALL_STATUSES } from "@/lib/jobLabels";
import { Application } from "@/lib/types/candidate/Application";

export default function Filtertabs({ applications, loading, setFilterStatus, filterStatus }: { applications: Application[]; loading: boolean; setFilterStatus: (filterStatus: string) => void; filterStatus: string }) {
    const counts = ALL_STATUSES.slice(1).reduce<Record<string, number>>((acc, s) => {
        acc[s.value] = applications.filter(a => a.status === s.value).length;
        return acc;
    }, {});
    return (
        <>
            {!loading && applications.length > 0 && (
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                    {ALL_STATUSES.map(s => (
                        <button
                            key={s.value}
                            onClick={() => setFilterStatus(s.value)}
                            className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all cursor-pointer border ${filterStatus === s.value
                                ? 'bg-[#00b14f] text-white border-[#00b14f]'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-[#00b14f] hover:text-[#00b14f]'
                                }`}
                        >
                            {s.label}
                            {s.value && counts[s.value] > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filterStatus === s.value ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {counts[s.value]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </>
    )
}