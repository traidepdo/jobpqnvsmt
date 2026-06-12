"use client";
import React, { useEffect, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";

// Import sub-components
import FilterToolbar from "./job-duyet/FilterToolbar";
import JobList from "./job-duyet/JobList";
import JobDetailPanel from "./job-duyet/JobDetailPanel";
import RejectModal from "./job-duyet/RejectModal";

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  size?: string;
  description?: string;
  website?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Job {
  id: string;
  title: string;
  slug: string;
  description: string;
  benefits?: string;
  requirements?: string;
  quantity: number;
  salaryMin?: number;
  salaryMax?: number;
  addressDetail?: string;
  type: string;
  experience?: string;
  level?: string;
  status: string;
  rejectReason?: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  company: Company;
  category: Category;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function JobDuyetContent() {
  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Filter States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedExperience, setSelectedExperience] = useState("");
  
  // Modals & Detail Viewer
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [customRejectReason, setCustomRejectReason] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Label Translators
  const expLabels: Record<string, string> = {
    NO_EXPERIENCE: "Không yêu cầu kinh nghiệm",
    UNDER_1_YEAR: "Dưới 1 năm",
    ONE_TO_THREE_YEARS: "1 - 3 năm",
    THREE_TO_FIVE_YEARS: "3 - 5 năm",
    OVER_FIVE_YEARS: "Trên 5 năm"
  };

  const levelLabels: Record<string, string> = {
    INTERN: "Thực tập sinh",
    FRESHER: "Mới tốt nghiệp",
    JUNIOR: "Junior",
    MID: "Mid-level",
    SENIOR: "Senior",
    LEAD: "Trưởng nhóm",
    MANAGER: "Trưởng phòng",
    DIRECTOR: "Giám đốc"
  };

  const typeLabels: Record<string, string> = {
    FULL_TIME: "Toàn thời gian",
    PART_TIME: "Bán thời gian",
    REMOTE: "Làm việc từ xa",
    CONTRACT: "Hợp đồng",
    INTERNSHIP: "Thực tập",
    FREELANCE: "Tự do"
  };

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/admin/categories?limit=100");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Jobs
  useEffect(() => {
    fetchJobs();
  }, [page, search, selectedCategory, selectedExperience]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        search,
        categoryId: selectedCategory,
        experience: selectedExperience,
      });
      const res = await fetch(`/api/admin/job-duyet?${params}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();
      setJobs(data.jobs || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error(err);
      showToast("Không thể tải danh sách tin tuyển dụng", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  // Approve action
  const handleApprove = async (job: Job) => {
    setActionLoading(job.id);
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      if (!res.ok) throw new Error();
      
      showToast(`Đã duyệt tin tuyển dụng "${job.title}" thành công!`, "success");
      setJobs(prev => prev.filter(j => j.id !== job.id));
      if (activeJob?.id === job.id) {
        setActiveJob(null);
      }
    } catch (err) {
      showToast("Duyệt tin thất bại, vui lòng thử lại.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Reject action
  const handleReject = async () => {
    if (!activeJob) return;
    setActionLoading(activeJob.id);
    try {
      const res = await fetch(`/api/admin/jobs/${activeJob.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "REJECTED",
          rejectReason: customRejectReason || activeJob.rejectReason || "Không đạt tiêu chuẩn duyệt tin tự động."
        }),
      });
      if (!res.ok) throw new Error();
      
      showToast(`Đã từ chối tin tuyển dụng "${activeJob.title}"`, "success");
      setJobs(prev => prev.filter(j => j.id !== activeJob.id));
      setRejectModalOpen(false);
      setActiveJob(null);
    } catch (err) {
      showToast("Từ chối tin thất bại, vui lòng thử lại.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Format Date
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format Salary
  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "Thỏa thuận";
    if (min && max) return `${(min / 1000000).toFixed(0)}tr - ${(max / 1000000).toFixed(0)}tr VND`;
    if (min) return `Từ ${(min / 1000000).toFixed(0)}tr VND`;
    if (max) return `Đến ${(max / 1000000).toFixed(0)}tr VND`;
    return "Thỏa thuận";
  };

  // Parse reject reason helper
  const parseRejectReason = (reason?: string) => {
    if (!reason) return null;
    const scoreMatch = reason.match(/\[(\d+)\s*điểm\]/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
    
    let words: string[] = [];
    const listIndex = reason.indexOf("Danh sách từ phát hiện:");
    if (listIndex !== -1) {
      const wordsPart = reason.substring(listIndex + "Danh sách từ phát hiện:".length);
      words = wordsPart.split(",").map(w => w.trim().split(" ")[0]);
    }
    
    return { score, words, raw: reason };
  };

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: "linear-gradient(135deg, #070a13 0%, #0c0f17 100%)" }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Kiểm Duyệt Tin Tuyển Dụng
            </h1>
            {!loading && pagination && (
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                {pagination.total} Tin chờ duyệt
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Hệ thống lọc tự động Aho-Corasick đã giữ lại các tin nghi vấn vi phạm dưới đây.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <FilterToolbar
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedExperience={selectedExperience}
        setSelectedExperience={setSelectedExperience}
        categories={categories}
        expLabels={expLabels}
        onSearchSubmit={handleSearch}
        onClearSearch={handleClearSearch}
      />

      {/* Main Layout: Split-pane if a job detail is open */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Jobs List Panel */}
        <div className={`${activeJob ? "lg:col-span-6 xl:col-span-5" : "lg:col-span-12"} transition-all duration-300`}>
          <JobList
            jobs={jobs}
            loading={loading}
            activeJob={activeJob}
            setActiveJob={setActiveJob}
            pagination={pagination}
            onPageChange={setPage}
            parseRejectReason={parseRejectReason}
            formatDate={formatDate}
            formatSalary={formatSalary}
          />

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 text-sm text-gray-400 bg-white/3 border border-white/10 rounded-2xl p-4">
              <span>Trang {pagination.page} / {pagination.totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={!pagination.hasPrev}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
                >
                  Trước
                </button>
                <button
                  disabled={!pagination.hasNext}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-35 disabled:cursor-not-allowed transition-all"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Job Details Panel */}
        {activeJob && (
          <div className="lg:col-span-6 xl:col-span-7">
            <JobDetailPanel
              activeJob={activeJob}
              onClose={() => setActiveJob(null)}
              actionLoading={actionLoading !== null}
              formatDate={formatDate}
              formatSalary={formatSalary}
              levelLabels={levelLabels}
              expLabels={expLabels}
              typeLabels={typeLabels}
              onApprove={handleApprove}
              onRejectTrigger={() => {
                setCustomRejectReason(
                  activeJob.rejectReason 
                    ? `Từ chối do: ${activeJob.rejectReason}` 
                    : "Không đạt tiêu chuẩn kiểm duyệt chất lượng nội dung tin tuyển dụng."
                );
                setRejectModalOpen(true);
              }}
            />
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      <RejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleReject}
        actionLoading={actionLoading !== null}
        customRejectReason={customRejectReason}
        setCustomRejectReason={setCustomRejectReason}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold shadow-2xl text-white border transition-all duration-300 animate-slide-up ${
          toast.type === "success" 
            ? "bg-emerald-600 border-emerald-500/50 shadow-emerald-900/10" 
            : "bg-red-600 border-red-500/50 shadow-red-900/10"
        }`}>
          {toast.type === "success" ? <FiCheck className="text-lg" /> : <FiX className="text-lg" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
