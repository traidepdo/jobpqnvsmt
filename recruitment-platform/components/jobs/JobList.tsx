import JobSaveButton from '@/components/jobs/JobSaveButton';
import Link from 'next/link';
import { Job } from '@/lib/types/Job';

interface JobLitsProps {
    jobs: Job[];
    savedJobs: Set<string>;
    appliedJobs: Set<string>;
    isLoggedIn: boolean;
    activeFilterCount: number;
    getClearFilterLink: () => string;
    formatSalary: (min: number | null, max: number | null) => string;
    getJobTypeLabel: (type: string) => string;
    getExperienceLabel: (experience: string) => string;
}

export default function JobList({ jobs, savedJobs, appliedJobs, isLoggedIn, activeFilterCount, getClearFilterLink, formatSalary, getJobTypeLabel, getExperienceLabel }: JobLitsProps) {
    return (
        <>
            {jobs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="font-semibold text-gray-700 text-lg mb-1">Không tìm thấy việc làm phù hợp</p>
                    <p className="text-sm text-gray-400 mb-5">Thử thay đổi từ khóa hoặc xóa bớt bộ lọc</p>
                    {activeFilterCount > 0 && (
                        <Link href={getClearFilterLink()}
                            className="inline-flex items-center gap-1.5 bg-[#00b14f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg cursor-pointer hover:bg-[#009940] transition-colors">
                            Xóa bộ lọc
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3.5">
                    {jobs.map(job => {
                        const saved = savedJobs.has(job.id);
                        return (
                            <article key={job.id}
                                className="bg-white rounded-2xl border border-slate-100 hover:border-[#00b14f]/35 hover:shadow-md transition-all duration-300 group relative active:scale-[0.99]">
                                <div className="p-5 flex gap-4">
                                    {/* Logo */}
                                    <div className="w-25 h-25 border border-slate-100 bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden m-5 outline outline-[#00b14f]/90 outline-[1px] p-[3px] rounded-lg">
                                        {job.company?.logo ? (
                                            <img src={job.company.logo} alt={job.company?.name || 'Company'} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#00b14f]/10 to-[#00b14f]/20 flex items-center justify-center">
                                                <span className="text-[#00b14f] font-black text-xl">{(job.company?.name || 'C').charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 pr-8">
                                        <div className="flex items-start gap-2 mb-1">
                                            <Link href={`/jobs/${job.slug}`} className="text-sm md:text-base font-bold text-slate-800 group-hover:text-[#00b14f] transition-colors line-clamp-1">
                                                {job.title}
                                            </Link>
                                            {appliedJobs.has(job.id) && (
                                                <span className="flex-shrink-0 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-lg mt-0.5">
                                                    Đã ứng tuyển
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs font-semibold text-[#00b14f] mb-3 hover:underline">
                                            <Link href={job.company?.slug ? `/jobs?company=${job.company.slug}` : '#'}>{job.company?.name || 'Công ty'}</Link>
                                        </p>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00b14f] bg-[#00b14f]/8 px-2.5 py-1 rounded-lg">
                                                {formatSalary(job.salaryMin, job.salaryMax)}
                                            </span>

                                            {job.salaryStatus && (
                                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border ${job.salaryStatus === 'good'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50'
                                                    : job.salaryStatus === 'bad'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-100/50'
                                                        : 'bg-indigo-50 text-indigo-700 border-indigo-100/50'
                                                    }`}>
                                                    <span className="material-symbols-outlined text-[13px] font-bold">
                                                        {job.salaryStatus === 'good' ? 'trending_up' : job.salaryStatus === 'bad' ? 'trending_down' : 'info'}
                                                    </span>
                                                    <span>
                                                        {job.salaryStatus === 'good'
                                                            ? `Lương tốt (+${Math.abs(job.salaryDiff || 0)}%)`
                                                            : job.salaryStatus === 'bad'
                                                                ? `Lương thấp (-${Math.abs(job.salaryDiff || 0)}%)`
                                                                : 'Lương cạnh tranh'}
                                                    </span>
                                                </span>
                                            )}

                                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                {job.ward?.name || 'Phú Quốc'}
                                            </span>

                                            <span className="inline-flex text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                                                {getJobTypeLabel(job.type)}
                                            </span>

                                            {job.experience && (
                                                <span className="inline-flex text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                                                    {getExperienceLabel(job.experience)}
                                                </span>
                                            )}

                                            <span className="inline-flex text-[9px] font-bold text-slate-450 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-lg">
                                                {job.category.name}
                                            </span>
                                        </div>

                                        {job.deadline && (
                                            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                                Hạn nộp: {new Date(job.deadline).toLocaleDateString('vi-VN')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Save button (client interaction) */}
                                <JobSaveButton
                                    jobId={job.id}
                                    initialSaved={saved}
                                    isLoggedIn={isLoggedIn}

                                />
                            </article>
                        );
                    })}
                </div>
            )}

        </>
    );

}