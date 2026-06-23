
import Link from "next/link"

type FilterType = 'category' | 'salary' | 'experience' | 'type' | 'level' | 'company';

export default function ActiveFilter({ 
    activeFilterCount, 
    category, 
    companySlug, 
    salary, 
    experience, 
    type, 
    level, 
    getCategoryName, 
    getFilterRemoveLink, 
    activeCompanyName, 
    SALARY_OPTIONS, 
    EXPERIENCE_OPTIONS, 
    TYPE_OPTIONS, 
    LEVEL_OPTIONS 
}: { 
    activeFilterCount: number;
    category: string;
    companySlug: string;
    salary: string;
    experience: string;
    type: string;
    level: string;
    getCategoryName: (category: string) => string;
    getFilterRemoveLink: (filter: FilterType) => string;
    activeCompanyName: string;
    SALARY_OPTIONS: { value: string; label: string }[];
    EXPERIENCE_OPTIONS: { value: string; label: string }[];
    TYPE_OPTIONS: { value: string; label: string }[];
    LEVEL_OPTIONS: { value: string; label: string }[];
}) {
    return (
        <>
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {category && (
                        <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                            {getCategoryName(category)}
                            <Link href={getFilterRemoveLink('category')} className="hover:text-red-500 cursor-pointer">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </Link>
                        </span>
                    )}
                    {companySlug && activeCompanyName && (
                        <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                            Công ty: {activeCompanyName}
                            <Link href={getFilterRemoveLink('company')} className="hover:text-red-500 cursor-pointer">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </Link>
                        </span>
                    )}
                    {salary && (
                        <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                            {SALARY_OPTIONS.find(o => o.value === salary)?.label}
                            <Link href={getFilterRemoveLink('salary')} className="hover:text-red-500 cursor-pointer">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </Link>
                        </span>
                    )}
                    {experience && (
                        <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                            {EXPERIENCE_OPTIONS.find(o => o.value === experience)?.label}
                            <Link href={getFilterRemoveLink('experience')} className="hover:text-red-500 cursor-pointer">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </Link>
                        </span>
                    )}
                    {type && (
                        <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                            {TYPE_OPTIONS.find(o => o.value === type)?.label}
                            <Link href={getFilterRemoveLink('type')} className="hover:text-red-500 cursor-pointer">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </Link>
                        </span>
                    )}
                    {level && (
                        <span className="inline-flex items-center gap-1.5 bg-[#00b14f]/10 text-[#00963e] text-[12px] font-medium px-2.5 py-1 rounded-full">
                            {LEVEL_OPTIONS.find(o => o.value === level)?.label}
                            <Link href={getFilterRemoveLink('level')} className="hover:text-red-500 cursor-pointer">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </Link>
                        </span>
                    )}
                </div>
            )}
        </>
    )
}