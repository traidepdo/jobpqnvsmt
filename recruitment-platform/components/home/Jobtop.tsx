import Link from "next/link"
import { formatSalary, getJobTypeLabel } from '@/lib/jobLabels';
import { prisma } from "@/lib/prisma";
import { companyCardSelect } from "@/lib/prismaSafe";
import { getLatestModel, predictSalary } from "@/lib/salaryPredictor";
import ReloadButton from "./ReloadButton";

interface Job {
    id: string;
    title: string;
    slug: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    type: string;
    status: string;
    company: { name: string; logo?: string | null; slug?: string };
    category: { name: string };
    ward?: { name: string } | null;
    salaryStatus?: 'good' | 'average' | 'bad' | null;
    salaryDiff?: number;
}

async function getFeaturedJobs() {
    try {
        const featuredJobsRaw = await prisma.job.findMany({
            where: { status: "ACTIVE" },
            take: 4,
            orderBy: { createdAt: "desc" },
            include: {
                company: { select: companyCardSelect },
                category: {
                    select: {
                        name: true
                    }
                },
                ward: {
                    select: {
                        name: true
                    }
                }
            }
        });

        const model = await getLatestModel();
        return featuredJobsRaw.map(job => {
            const min = job.salaryMin;
            const max = job.salaryMax;
            
            let actualSalary: number | null = null;
            if (min !== null && max !== null) {
                actualSalary = (min + max) / 2;
            } else if (min !== null) {
                actualSalary = min;
            } else if (max !== null) {
                actualSalary = max;
            }
            
            let salaryStatus: 'good' | 'average' | 'bad' | null = null;
            let salaryDiff = 0;
            
            if (actualSalary !== null) {
                if (actualSalary > 100000) {
                    actualSalary = actualSalary / 1000000;
                }
                
                const predicted = predictSalary({
                    experience: job.experience,
                    level: job.level,
                    type: job.type,
                    categoryId: job.categoryId,
                    wardId: job.wardId,
                }, model);
                
                salaryDiff = Math.round(((actualSalary - predicted) / predicted) * 100);
                if (actualSalary >= 1.15 * predicted) {
                    salaryStatus = 'good';
                } else if (actualSalary < 0.9 * predicted) {
                    salaryStatus = 'bad';
                } else {
                    salaryStatus = 'average';
                }
            }
            
            return {
                ...job,
                salaryStatus,
                salaryDiff
            };
        }) as Job[];
    } catch (error) {
        console.error("Error fetching featured jobs:", error);
        return [];
    }
}

export default async function JobTop() {
    const featuredJobs = await getFeaturedJobs();

    return (
        <section className="py-6 pb-24 px-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-end justify-between mb-12">
                <div>
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-green-600 mb-3"
                        style={{ letterSpacing: '0.15em' }}>✦ Nổi bật</span>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Việc làm nổi bật</h2>
                    <p className="text-gray-500 mt-2 text-sm">Cập nhật mới nhất từ các nhà tuyển dụng uy tín</p>
                </div>
                <Link href="/jobs"
                    className="hidden sm:flex items-center gap-1.5 text-green-600 text-sm font-bold hover:text-green-700 transition-colors group">
                    Xem tất cả
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
                    </svg>
                </Link>
            </div>

            {featuredJobs.length === 0 ? (
                <div className="text-center py-20 rounded-3xl"
                    style={{ background: 'rgba(255,255,255,0.8)', border: '2px dashed rgba(22,163,74,0.2)' }}>
                    <div className="text-5xl mb-4">💼</div>
                    <p className="font-bold text-gray-700 mb-1 text-lg">Chưa có tin tuyển dụng</p>
                    <p className="text-sm text-gray-400 mb-6">Vui lòng thử tải lại trang</p>
                    <div className="flex items-center justify-center gap-3">
                        <ReloadButton />
                        <Link href="/jobs"
                            className="text-sm px-5 py-2.5 text-white rounded-xl font-semibold transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                            Xem việc làm
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {featuredJobs.map((job, idx) => (
                            <Link key={job.id} href={job.slug ? `/jobs/${job.slug}` : '/jobs'}
                                className="job-card-premium group relative block rounded-2xl p-5 overflow-hidden"
                                style={{
                                    background: 'rgba(255,255,255,0.92)',
                                    border: '1px solid rgba(22,163,74,0.1)',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                    animationDelay: `${idx * 0.05}s`,
                                }}>
                                {/* Top gradient accent */}
                                <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{ background: 'linear-gradient(90deg, #16a34a, #4ade80, #22c55e)' }} />

                                <div className="flex gap-4 items-start">
                                    {/* Company logo */}
                                    <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden transition-transform duration-300 group-hover:scale-105"
                                        style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid rgba(22,163,74,0.15)' }}>
                                        {job.company.logo ? (
                                            <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">🏢</div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-green-700 transition-colors">{job.title}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5 font-medium">{job.company.name}</p>
                                            </div>
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${job.status === 'ACTIVE'
                                                ? 'text-green-700 bg-green-50 border border-green-200'
                                                : 'text-amber-700 bg-amber-50 border border-amber-200'
                                                }`}>
                                                {job.status === 'ACTIVE' ? '● Đang tuyển' : '○ Sắp tuyển'}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 px-2.5 py-1 rounded-lg font-medium"
                                                style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.12)' }}>
                                                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                                                </svg>
                                                {job.ward?.name || 'Phú Quốc'}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 px-2.5 py-1 rounded-lg font-medium"
                                                style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.12)' }}>
                                                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                                </svg>
                                                {getJobTypeLabel(job.type)}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 px-2.5 py-1 rounded-lg"
                                                style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)' }}>
                                                {formatSalary(job.salaryMin ?? null, job.salaryMax ?? null)}
                                            </span>

                                            {job.salaryStatus && (
                                                <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${job.salaryStatus === 'good'
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
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* View all button */}
                    <div className="text-center mt-10">
                        <Link href="/jobs"
                            className="shimmer-btn inline-flex items-center gap-2.5 font-bold text-sm px-8 py-3.5 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg"
                            style={{
                                color: '#16a34a',
                                border: '2px solid rgba(22,163,74,0.4)',
                                background: 'rgba(22,163,74,0.05)',
                                boxShadow: '0 4px 15px rgba(22,163,74,0.1)',
                            }}>
                            Xem tất cả việc làm
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
                            </svg>
                        </Link>
                    </div>
                </>
            )}
        </section>
    )
}