import { getJobFlash } from "@/lib/services/job-flash/apiflash";
import JobFlashClient from "./JobFlashClient";
import { Suspense } from "react";

function JobFlashSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
                {/* Banner Skeleton */}
                <div className="h-48 bg-slate-200 rounded-3xl w-full" />

                {/* Search & Filter Bar Skeleton */}
                <div className="h-24 bg-slate-200 rounded-2xl w-full" />

                {/* Cards Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-64 bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 bg-slate-200 rounded-xl" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                                </div>
                            </div>
                            <div className="space-y-2 py-2">
                                <div className="h-3 bg-slate-100 rounded w-2/3" />
                                <div className="h-3 bg-slate-100 rounded w-4/5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default async function JobFlashPage() {
    const jobs = await getJobFlash();

    return (
        <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <Suspense fallback={<JobFlashSkeleton />}>
                    <JobFlashClient initialJobs={jobs} />
                </Suspense>
            </div>
        </div>
    );
}