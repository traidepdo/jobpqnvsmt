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
                <div className="space-y-2.5">
                    {jobs.map(job => {
                        const saved = savedJobs.has(job.id);
                        return (
                            <article key={job.id}
                                className="bg-white rounded-xl border border-gray-100 hover:border-[#00b14f]/40 hover:shadow-md transition-all group relative">
                                <Link href={`/jobs/${job.slug}`} className="block p-4">
                                    <div className="flex gap-3.5">
                                        {/* Logo */}
                                        <div className="w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {job.company.logo ? (
                                                <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-[#00b14f]/10 to-[#00b14f]/20 flex items-center justify-center">
                                                    <span className="text-[#00b14f] font-bold text-lg">{job.company.name.charAt(0)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 pr-8">
                                            <div className="flex items-start gap-2 mb-0.5">
                                                <h2 className="text-[14px] font-bold text-gray-900 group-hover:text-[#00b14f] transition-colors line-clamp-1">
                                                    {job.title}
                                                </h2>
                                                {appliedJobs.has(job.id) && (
                                                    <span className="flex-shrink-0 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded mt-0.5">
                                                        Đã ứng tuyển
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-[12px] font-medium text-[#00b14f] mb-2 line-clamp-1">
                                                {job.company.name}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {formatSalary(job.salaryMin, job.salaryMax)}
                                                </span>

                                                {job.salaryStatus && (
                                                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${job.salaryStatus === 'good'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : job.salaryStatus === 'bad'
                                                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                        }`}>
                                                        <span>{job.salaryStatus === 'good' ? '✨' : job.salaryStatus === 'bad' ? '⚠️' : 'ℹ️'}</span>
                                                        <span>
                                                            {job.salaryStatus === 'good'
                                                                ? `Lương tốt (+${Math.abs(job.salaryDiff || 0)}%)`
                                                                : job.salaryStatus === 'bad'
                                                                    ? `Lương thấp (-${Math.abs(job.salaryDiff || 0)}%)`
                                                                    : 'Lương cạnh tranh'}
                                                        </span>
                                                    </span>
                                                )}

                                                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {job.ward?.name || 'Phú Quốc'}
                                                </span>

                                                <span className="inline-flex text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                                                    {getJobTypeLabel(job.type)}
                                                </span>

                                                {job.experience && (
                                                    <span className="inline-flex text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                                                        {getExperienceLabel(job.experience)}
                                                    </span>
                                                )}

                                                <span className="inline-flex text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-100 px-2 py-0.5 rounded-md">
                                                    {job.category.name}
                                                </span>
                                            </div>

                                            {job.deadline && (
                                                <p className="text-[11px] text-gray-400 mt-1.5">
                                                    Hạn nộp: {new Date(job.deadline).toLocaleDateString('vi-VN')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>

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