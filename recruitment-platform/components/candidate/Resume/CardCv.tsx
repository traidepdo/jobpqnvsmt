import { formatDateVi } from "@/lib/jobLabels";
import { Resume } from "@/lib/types/candidate/Resume";

export default function CardCv({ r }: { r: Resume }) {
    return (
        <div className="flex gap-4 items-start">
            <div className="w-16 h-20 bg-gradient-to-br from-[#00b14f]/10 to-[#041b3c]/5 rounded-lg flex items-center justify-center border border-gray-100 shrink-0 overflow-hidden">
                {r.template?.thumbnailUrl ? (
                    <img src={r.template.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                    <span className="material-symbols-outlined text-3xl text-[#00b14f]">description</span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base md:text-lg text-[#041b3c] truncate hover:text-[#00b14f] transition-colors flex items-center gap-1.5 flex-wrap">
                    <a href={`/cv/${r.id}`} target="_blank" rel="noreferrer" title={r.title}>
                        {r.title}
                    </a>
                    {r.isDefault && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00b14f] text-white shrink-0">
                            Mặc định
                        </span>
                    )}
                    {r.isProfile ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0052cc] text-white shrink-0">
                            Profile
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shrink-0">
                            CV
                        </span>
                    )}
                </h3>
                <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                    {r.template && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#00b14f]/10 text-[#00b14f]">
                            Mẫu: {r.template.name}
                        </span>
                    )}
                    <span className="inline-flex items-center text-xs text-gray-400">
                        <span className="material-symbols-outlined text-xs mr-1 text-[14px]">history</span>
                        {formatDateVi(r.updatedAt)}
                    </span>
                </div>
            </div>
        </div>

    );
}