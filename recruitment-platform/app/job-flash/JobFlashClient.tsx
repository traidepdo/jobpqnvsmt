"use client";

import { useState, useTransition, useMemo } from "react";
import { JobFlash } from "@/lib/services/job-flash/apiflash";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
    initialJobs: JobFlash[];
    currentUserId?: string;
}

export function formatJobSalary(min?: number | null, max?: number | null) {
    if (!min && !max) return "Thỏa thuận";

    const formatVal = (val: number) => {
        if (val >= 1000000) {
            const inM = val / 1000000;
            return `${inM % 1 === 0 ? inM.toFixed(0) : inM.toFixed(1)} triệu`;
        }
        if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
        return `${val} triệu`;
    };

    if (min && max) return `${formatVal(min)} - ${formatVal(max)}`;
    if (min) return `Từ ${formatVal(min)}`;
    if (max) return `Đến ${formatVal(max)}`;
    return "Thỏa thuận";
}

export default function JobFlashClient({ initialJobs, currentUserId = "user_demo_employer" }: Props) {
    const router = useRouter();
    const [jobs, setJobs] = useState<JobFlash[]>(initialJobs);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [selectedSalaryStatus, setSelectedSalaryStatus] = useState("ALL");
    const [selectedExp, setSelectedExp] = useState("ALL");
    const [selectedOnlyMine, setSelectedOnlyMine] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [applyNotice, setApplyNotice] = useState<string | null>(null);

    // Categories
    const categories = useMemo(() => {
        const set = new Set<string>();
        jobs.forEach((j) => set.add(j.category.name));
        return Array.from(set);
    }, [jobs]);

    // Helper to normalize salary to Millions for filtering
    const getSalaryInMillions = (val?: number | null) => {
        if (!val) return 0;
        return val >= 1000000 ? val / 1000000 : val;
    };

    // Filter jobs
    const filteredJobs = useMemo(() => {
        return jobs.filter((job) => {
            const matchesSearch =
                search === "" ||
                job.title.toLowerCase().includes(search.toLowerCase()) ||
                (job.company?.name && job.company.name.toLowerCase().includes(search.toLowerCase()));

            const matchesCategory =
                selectedCategory === "ALL" || job.category.name === selectedCategory;

            const minM = getSalaryInMillions(job.salaryMin);
            const maxM = getSalaryInMillions(job.salaryMax) || minM;
            const salVal = maxM || minM;

            const matchesSalary = (() => {
                if (selectedSalaryStatus === "ALL") return true;
                if (selectedSalaryStatus === "AGREEMENT") return !job.salaryMin && !job.salaryMax;
                if (selectedSalaryStatus === "UNDER_10M") return salVal > 0 && salVal < 10;
                if (selectedSalaryStatus === "10M_20M") return salVal >= 10 && salVal <= 20;
                if (selectedSalaryStatus === "OVER_20M") return salVal > 20;
                return true;
            })();

            const matchesExp =
                selectedExp === "ALL" ||
                (selectedExp === "NO_EXP" && (!job.experience || job.experience.toLowerCase().includes("không"))) ||
                (selectedExp === "HAS_EXP" && job.experience && !job.experience.toLowerCase().includes("không"));

            const matchesMine = !selectedOnlyMine || job.company?.ownerId === currentUserId;

            return matchesSearch && matchesCategory && matchesSalary && matchesExp && matchesMine;
        });
    }, [jobs, search, selectedCategory, selectedSalaryStatus, selectedExp, selectedOnlyMine, currentUserId]);

    const handleDeleteJob = (jobId: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa tin tuyển dụng này?")) {
            setJobs(jobs.filter(j => j.id !== jobId));
            setApplyNotice("🗑️ Đã xóa tin tuyển dụng Flash!");
            setTimeout(() => setApplyNotice(null), 3000);
        }
    };

    const handleSearchChange = (val: string) => {
        startTransition(() => {
            setSearch(val);
        });
    };

    // Xử lý tạo tin nhắn chat mang thông tin công việc
    const handleChatJobInfo = (job: JobFlash) => {
        const salaryText = formatJobSalary(job.salaryMin, job.salaryMax);
        const companyName = job.company?.name || "Nhà tuyển dụng";
        const messageText = `Xin chào! Tôi rất quan tâm và muốn trao đổi về vị trí tuyển dụng: "${job.title}" tại ${companyName} (Mức lương: ${salaryText}).`;

        router.push(`/candidate/messages?text=${encodeURIComponent(messageText)}`);
    };

    return (
        <div className="space-y-8 pb-16 font-sans">
            {/* Alert Notification Popup */}
            {applyNotice && (
                <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
                    <span className="material-symbols-outlined text-amber-400">notifications</span>
                    <span className="text-sm font-semibold">{applyNotice}</span>
                </div>
            )}

            {/* Header Hero Banner Premium */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 sm:p-12 border border-slate-800 shadow-2xl">
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold text-amber-400">
                            <span className="material-symbols-outlined text-sm animate-pulse text-amber-400">bolt</span>
                            <span>Tốc độ & Uy tín hàng đầu</span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-3">
                            Job Flash
                            <span className="material-symbols-outlined text-4xl sm:text-5xl text-amber-400">bolt</span>
                        </h1>

                        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                            Nền tảng kết nối tuyển dụng siêu tốc tại Phú Quốc. Đăng tin tuyển dụng nhận hồ sơ ngay lập tức.
                        </p>
                    </div>

                    {/* Nút Đăng Tin Tuyển Dụng Nhanh */}
                    <Link
                        href={"/job-flash/create"}
                        className="self-start md:self-center shrink-0 flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-slate-950 font-extrabold px-6 py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-2xl">bolt</span>
                        <span>Đăng tin Flash nhanh</span>
                    </Link>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="sticky top-4 z-30 bg-white/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xl shadow-slate-200/40 space-y-4">
                <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-slate-400 text-xl pointer-events-none">
                        search
                    </span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Tìm kiếm công việc, tên công ty..."
                        className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                    />
                    {search && (
                        <button
                            onClick={() => handleSearchChange("")}
                            className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1 mr-1">
                        <span className="material-symbols-outlined text-base text-blue-600">tune</span>
                        Bộ lọc:
                    </span>

                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                        {[
                            { id: "ALL", label: "Tất cả lương", icon: "payments" },
                            { id: "UNDER_10M", label: "Dưới 10tr", icon: "south_east" },
                            { id: "10M_20M", label: "10 - 20tr", icon: "equalizer" },
                            { id: "OVER_20M", label: "Trên 20tr", icon: "trending_up" },
                            { id: "AGREEMENT", label: "Thỏa thuận", icon: "handshake" },
                        ].map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedSalaryStatus(s.id)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all ${selectedSalaryStatus === s.id
                                    ? "bg-white text-blue-600 shadow-sm font-bold scale-105"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">{s.icon}</span>
                                <span>{s.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                        {[
                            { id: "ALL", label: "Tất cả KN", icon: "work_history" },
                            { id: "NO_EXP", label: "Không cần KN", icon: "school" },
                            { id: "HAS_EXP", label: "Có kinh nghiệm", icon: "badge" },
                        ].map((e) => (
                            <button
                                key={e.id}
                                onClick={() => setSelectedExp(e.id)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all ${selectedExp === e.id
                                    ? "bg-white text-blue-600 shadow-sm font-bold scale-105"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">{e.icon}</span>
                                <span>{e.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Filter Tin của tôi */}
                    <button
                        onClick={() => setSelectedOnlyMine((p) => !p)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all ${selectedOnlyMine
                            ? "bg-amber-500 text-slate-950 shadow-md font-extrabold scale-105"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200/60"
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">person</span>
                        <span>Tin tôi đăng</span>
                    </button>

                    {/* Category Select Dropdown */}
                    {categories.length > 0 && (
                        <div className="relative inline-flex items-center">
                            <span className="material-symbols-outlined absolute left-2.5 text-slate-400 text-sm pointer-events-none">
                                category
                            </span>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-slate-100 text-slate-700 font-semibold pl-8 pr-4 py-1.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer appearance-none"
                            >
                                <option value="ALL">Ngành nghề ({categories.length})</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Counter */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">Danh sách việc làm</span>
                    <span className="bg-blue-50 text-blue-700 border border-blue-200/60 text-xs px-2.5 py-0.5 rounded-full font-bold">
                        {filteredJobs.length} vị trí
                    </span>
                </div>
            </div>

            {/* Grid Jobs List */}
            {isPending ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <div key={n} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4 animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 bg-slate-200 rounded-xl" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3">
                    <span className="material-symbols-outlined text-5xl text-slate-300">search_off</span>
                    <h3 className="text-lg font-bold text-slate-800">Không tìm thấy công việc nào</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => {
                        const isOwner = job.company?.ownerId === currentUserId;
                        const salaryText = formatJobSalary(job.salaryMin, job.salaryMax);

                        return (
                            <div
                                key={job.id}
                                className={`group relative bg-white rounded-2xl p-6 border shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between ${isOwner ? "border-amber-300 bg-amber-50/10" : "border-slate-100"
                                    }`}
                            >
                                {isOwner && (
                                    <div className="absolute top-3 right-3 bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">person</span>
                                        Tin của bạn
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-14 h-14 rounded-2xl border border-slate-100 bg-slate-50 p-2 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                                            {job.company?.logo ? (
                                                <img
                                                    src={job.company.logo}
                                                    alt={job.company.name}
                                                    className="w-full h-full object-contain rounded-lg"
                                                />
                                            ) : (
                                                <span className="material-symbols-outlined text-2xl text-slate-400">
                                                    business
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1 pr-12">
                                            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base line-clamp-1">
                                                {job.title}
                                            </h3>
                                            <p className="text-xs font-medium text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm text-slate-400">apartment</span>
                                                {job.company?.name || ""}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 my-5">
                                        <div className="flex items-center text-xs font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                                            <span className="material-symbols-outlined text-base text-slate-400 mr-2">location_on</span>
                                            <span className="truncate">{job.ward?.name || "Toàn quốc"}</span>
                                        </div>

                                        <div className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-50/70 px-3 py-2 rounded-xl border border-emerald-100/80">
                                            <span className="material-symbols-outlined text-base text-emerald-600 mr-2">payments</span>
                                            <span>{salaryText}</span>
                                        </div>

                                        <div className="flex items-center text-xs font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                                            <span className="material-symbols-outlined text-base text-slate-400 mr-2">grid_view</span>
                                            <span className="truncate">{job.category.name}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                                        🎓 {job.experience || "Không KN"}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        {isOwner && (
                                            <button
                                                onClick={() => handleDeleteJob(job.id)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                                title="Xóa tin này"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        )}

                                        {/* Nút Chat & Gửi thông tin công việc */}
                                        <button
                                            onClick={() => handleChatJobInfo(job)}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#00b14f] hover:bg-[#009940] text-white shadow-md shadow-[#00b14f]/20 active:scale-95 transition-all cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-base">chat</span>
                                            <span>Nhắn tin & Gửi TT công việc</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
