'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatSalary } from '@/lib/jobLabels';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const JobMapDisplay = dynamic(() => import('@/components/public/JobMapDisplay'), {
  ssr: false,
  loading: () => <div className="h-48 w-full bg-gray-50 border border-dashed rounded-xl flex items-center justify-center text-xs text-gray-400 mt-3">Đang tải bản đồ địa điểm...</div>
});

interface JobDetails {
  id: string;
  title: string;
  slug: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  type: string;
  experience: string | null;
  level: string | null;
  quantity: number;
  deadline: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    logo: string | null;
    website: string | null;
    description: string | null;
    size?: string | null;
    industry: string | null;
    addressDetail: string | null;
    ward?: { name: string } | null;
  };
  category: { name: string };
  ward: { name: string } | null;
  addressDetail: string | null;
  quizId: string | null;
  latitude: number | null;
  longitude: number | null;
}

const getJobTypeLabel = (type?: string) => {
  switch (type) {
    case 'FULL_TIME': return 'Toàn thời gian';
    case 'PART_TIME': return 'Bán thời gian';
    case 'CONTRACT': return 'Hợp đồng';
    case 'INTERNSHIP': return 'Thực tập';
    case 'REMOTE': return 'Từ xa';
    default: return type || '';
  }
};

const getExperienceLabel = (exp?: string | null) => {
  switch (exp) {
    case 'NO_EXPERIENCE': return 'Không yêu cầu';
    case 'UNDER_1_YEAR': return 'Dưới 1 năm';
    case 'ONE_TO_THREE_YEARS': return '1 – 3 năm';
    case 'THREE_TO_FIVE_YEARS': return '3 – 5 năm';
    case 'OVER_FIVE_YEARS': return 'Trên 5 năm';
    default: return 'Không yêu cầu';
  }
};

export default function JobViewPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [userResumes, setUserResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'requirements' | 'benefits'>('description');
  const [applications, setApplications] = useState<any[]>([]);
  const [relatedJobs, setRelatedJobs] = useState<any[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [salaryAnalysis, setSalaryAnalysis] = useState<{
    predictedSalary: number;
    status: 'good' | 'average' | 'bad';
    percentageDiff: number;
    comparisonMessage: string;
  } | null>(null);

  // Quiz states
  const [quizPhase, setQuizPhase] = useState<'none' | 'info' | 'quiz'>('none');
  const [quizData, setQuizData] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);

  useEffect(() => {
    async function loadJob(): Promise<JobDetails | null> {
      try {
        const res = await fetch(`/api/public/jobs/${params.slug}`);
        if (!res.ok) throw new Error('Không tìm thấy công việc');
        const data = await res.json();
        setJob(data);
        fetchRelatedJobs(params.slug as string);

        // Fetch salary analysis
        fetch('/api/public/salary/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            experience: data.experience,
            level: data.level,
            type: data.type,
            categoryId: data.categoryId,
            wardId: data.wardId,
            salaryMin: data.salaryMin,
            salaryMax: data.salaryMax,
          }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d && !d.error) setSalaryAnalysis(d);
          })
          .catch((err) => console.error('Error analyzing salary:', err));

        return data;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Lỗi tải công việc');
        return null;
      } finally {
        setLoading(false);
      }
    }

    async function fetchRelatedJobs(slug: string) {
      try {
        const res = await fetch(`/api/public/jobs/${slug}/recommend`);
        if (res.ok) {
          const data = await res.json();
          setRelatedJobs(data);
        }
      } catch (err) {
        console.error("Lỗi tải công việc liên quan:", err);
      } finally {
        setRelatedLoading(false);
      }
    }
    async function checkAuth(jobData: JobDetails) {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }
        const data = await res.json();
        if (!data.user) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        setUser(data.user);

        if (data.user.role !== 'CANDIDATE') {
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
        const [resumeRes, savedRes, applicationsRes] = await Promise.all([
          fetch('/api/candidate/resumes'),
          fetch('/api/candidate/saved-jobs'),
          fetch('/api/candidate/applications'),
        ]);
        if (resumeRes.ok) {
          const d = await resumeRes.json();
          setUserResumes(d.resumes || []);
        }
        if (savedRes.ok) {
          const d = await savedRes.json();
          setIsSaved((d.savedJobs || []).some((s: { job: { id: string } }) => s.job.id === jobData.id));
        }
        if (applicationsRes.ok) {
          const d = await applicationsRes.json();
          setApplications(d.applications || []);
        }
      } catch (e) { console.error(e); }
    }

    if (params.slug) loadJob().then(d => { if (d) checkAuth(d); });
  }, [params.slug]);

  useEffect(() => {
    if (job) {
      document.title = `${job.title} - ${job.company.name} | Phú Quốc Jobs`;
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      const descText = `${job.title} tuyển dụng tại ${job.company.name} (${job.ward?.name || 'Phú Quốc'}). Mức lương hấp dẫn, môi trường làm việc chuyên nghiệp. Nộp hồ sơ ứng tuyển ngay!`;
      metaDesc.setAttribute('content', descText);
    }
  }, [job]);
  const checkAplicated = () => {
    return applications.some((app: any) => app.jobId === job?.id);
  };
  const userApplication = applications.find((app: any) => app.jobId === job?.id);
  const isApplied = !!userApplication;
  const handleApplyClick = () => {
    if (!user) {
      router.push(`/login?callbackUrl=/jobs/${params.slug}`);
      return;
    }
    if (user.role !== 'CANDIDATE') {
      alert('Tài khoản của bạn không phải là tài khoản ứng viên. Vui lòng đăng nhập tài khoản ứng viên để ứng tuyển.');
      return;
    }
    setShowApplyModal(true);
  };

  const handleToggleSave = async () => {
    if (!user) {
      router.push(`/login?callbackUrl=/jobs/${params.slug}`);
      return;
    }
    if (user.role !== 'CANDIDATE') {
      alert('Tài khoản của bạn không phải là tài khoản ứng viên. Vui lòng đăng nhập tài khoản ứng viên để lưu công việc.');
      return;
    }
    if (!job) return;
    setSaveLoading(true);
    try {
      if (isSaved) {
        const res = await fetch(`/api/candidate/saved-jobs?jobId=${job.id}`, { method: 'DELETE' });
        if (res.status === 401 || res.status === 403) {
          router.push(`/login?callbackUrl=/jobs/${params.slug}`);
          return;
        }
        if (res.ok) setIsSaved(false);
      } else {
        const res = await fetch('/api/candidate/saved-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id }),
        });
        if (res.status === 401 || res.status === 403) {
          router.push(`/login?callbackUrl=/jobs/${params.slug}`);
          return;
        }
        if (res.ok) setIsSaved(true);
      }
    } catch (e) { console.error(e); }
    finally { setSaveLoading(false); }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleQuizSubmit = (auto = false) => {
    const answersList = quizQuestions.map(q => ({
      questionId: q.id,
      selectedOption: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
    }));
    submitApplication(answersList);
  };

  const submitApplication = async (answersList?: any[]) => {
    setApplyLoading(true);
    try {
      let uploadedCvUrl = null;
      if (cvFile) {
        const formData = new FormData();
        formData.append('file', cvFile);
        const uploadRes = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Tải file CV lên thất bại.');
        }
        const uploadData = await uploadRes.json();
        uploadedCvUrl = uploadData.url;
      }

      const payload: any = {
        jobId: job?.id,
        coverLetter,
        resumeId: selectedResumeId || null,
        cvUrl: uploadedCvUrl || null,
      };

      if (job?.quizId && answersList) {
        payload.quizAnswers = answersList;
        if (quizStartTime) {
          payload.quizDuration = Math.round((Date.now() - quizStartTime) / 1000);
        }
      }

      const res = await fetch('/api/candidate/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setApplySuccess(true);
        setTimeout(() => {
          setShowApplyModal(false);
          setApplySuccess(false);
          setCoverLetter('');
          setSelectedResumeId('');
          setCvFile(null);
          setQuizPhase('none');
          setQuizData(null);
          setQuizQuestions([]);
          setSelectedAnswers({});
          setCurrentQuestionIndex(0);
        }, 2500);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể nộp hồ sơ. Vui lòng thử lại.');
      }
    } catch (e: any) {
      alert(e.message || 'Đã xảy ra lỗi khi nộp hồ sơ.');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleCancelApplication = () => {
    setShowCancelModal(true);
  };

  const confirmCancelApplication = async () => {
    if (!userApplication) return;
    setApplyLoading(true);
    try {
      const res = await fetch(`/api/candidate/applications?id=${userApplication.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setApplications(prev => prev.filter((app: any) => app.id !== userApplication.id));
        setCancelSuccess(true);
        setTimeout(() => setCancelSuccess(false), 2000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Không thể hủy ứng tuyển. Vui lòng thử lại.');
      }
    } catch (e) {
      console.error(e);
      alert('Đã xảy ra lỗi khi hủy ứng tuyển.');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push(`/login?callbackUrl=/jobs/${params.slug}`); return; }
    if (user.role !== 'CANDIDATE') { alert('Tài khoản của bạn không phải là tài khoản ứng viên.'); return; }
    if (!selectedResumeId && !cvFile) { alert('Vui lòng chọn CV hoặc tải file lên.'); return; }
    
    if (job?.quizId) {
      setApplyLoading(true);
      try {
        const res = await fetch(`/api/candidate/quizzes/${job.quizId}`);
        if (!res.ok) throw new Error('Không thể tải bài kiểm tra');
        const data = await res.json();
        if (data.quiz) {
          setQuizData(data.quiz);
          setQuizQuestions(data.quiz.questions || []);
          setQuizPhase('info');
        } else {
          throw new Error('Dữ liệu bài thi không hợp lệ');
        }
      } catch (err: any) {
        alert(err.message || 'Lỗi tải bài thi. Vui lòng thử lại.');
      } finally {
        setApplyLoading(false);
      }
      return;
    }

    submitApplication();
  };

  useEffect(() => {
    if (quizPhase !== 'quiz' || timeLeft <= 0) {
      if (quizPhase === 'quiz' && timeLeft <= 0) {
        alert('Hết thời gian làm bài! Hệ thống tự động nộp bài thi của bạn.');
        handleQuizSubmit(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [quizPhase, timeLeft]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#00b14f] border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f5]">
        <div className="text-center bg-white rounded-2xl p-10 max-w-sm border border-gray-100 shadow-sm">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy tin tuyển dụng</h2>
          <p className="text-sm text-gray-500 mb-6">{error || 'Công việc này đã đóng hoặc không tồn tại.'}</p>
          <button onClick={() => router.push('/')} className="bg-[#00b14f] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#009940] transition-colors cursor-pointer">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'description', label: 'Mô tả', show: !!job.description },
    { key: 'requirements', label: 'Yêu cầu', show: !!job.requirements },
    { key: 'benefits', label: 'Quyền lợi', show: !!job.benefits },
  ].filter(t => t.show);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phuquocjobs.vn';

  const jobSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    'title': job.title,
    'description': job.description + (job.requirements ? `\n\nYêu cầu:\n${job.requirements}` : '') + (job.benefits ? `\n\nQuyền lợi:\n${job.benefits}` : ''),
    'datePosted': job.createdAt || '2026-06-01T00:00:00.000Z',
    'employmentType': job.type === 'PART_TIME' ? 'PART_TIME' : job.type === 'CONTRACT' ? 'CONTRACT' : job.type === 'INTERNSHIP' ? 'INTERNSHIP' : 'FULL_TIME',
    'hiringOrganization': {
      '@type': 'Organization',
      'name': job.company.name,
      'logo': job.company.logo || undefined,
      'sameAs': job.company.website || undefined,
    },
    'jobLocation': {
      '@type': 'Place',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': job.ward?.name || 'Phú Quốc',
        'addressRegion': 'Kiên Giang',
        'addressCountry': 'VN',
        'streetAddress': job.addressDetail || undefined,
      }
    },
    ...(job.salaryMin || job.salaryMax ? {
      'baseSalary': {
        '@type': 'MonetaryAmount',
        'currency': 'VND',
        'value': {
          '@type': 'QuantitativeValue',
          'minValue': job.salaryMin || undefined,
          'maxValue': job.salaryMax || undefined,
          'unitText': 'MONTH'
        }
      }
    } : {})
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Trang chủ',
        'item': baseUrl,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Việc làm',
        'item': `${baseUrl}/jobs`,
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': job.category.name,
        'item': `${baseUrl}/jobs?category=${encodeURIComponent(job.category.name)}`,
      },
      {
        '@type': 'ListItem',
        'position': 4,
        'name': job.title,
        'item': `${baseUrl}/jobs/${job.slug}`,
      }
    ]
  };

  const relatedJobsSchema = relatedJobs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Việc làm liên quan',
    'itemListElement': relatedJobs.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'url': `${baseUrl}/jobs/${item.slug}`,
      'name': item.title,
    }))
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {relatedJobsSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(relatedJobsSchema) }}
        />
      )}
      <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        * { font-family: 'Be Vietnam Pro', sans-serif; }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .apply-btn { transition: all 0.2s ease; }
        .apply-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,177,79,0.3); }
        .apply-btn:active { transform: scale(0.98); }
        .tab-btn { transition: all 0.2s ease; }
        .highlight-card { transition: all 0.15s ease; }
        .highlight-card:hover { transform: translateY(-1px); }
      `}</style>

      <div className="min-h-screen bg-[#f4f7f5] pb-20 pt-15" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

        {/* ── Hero Banner ─────────────────────────────── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
            <div className="flex gap-4 items-start">

              {/* Logo */}
              <div className="w-14 h-14 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {job.company.logo ? (
                  <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-contain p-1.5" />
                ) : (
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M8 10h2m-2 4h2m4-4h2m-2 4h2" strokeWidth={1.5} strokeLinecap="round" />
                  </svg>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
                    {job.category.name}
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {getJobTypeLabel(job.type)}
                  </span>
                  {salaryAnalysis && (
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                      salaryAnalysis.status === 'good'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : salaryAnalysis.status === 'bad'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`} title={salaryAnalysis.comparisonMessage}>
                      <span>
                        {salaryAnalysis.status === 'good' ? '✨' : salaryAnalysis.status === 'bad' ? '⚠️' : 'ℹ️'}
                      </span>
                      <span>
                        {salaryAnalysis.status === 'good'
                          ? `Lương tốt (+${Math.abs(salaryAnalysis.percentageDiff)}%)`
                          : salaryAnalysis.status === 'bad'
                            ? `Lương thấp hơn trung bình (-${Math.abs(salaryAnalysis.percentageDiff)}%)`
                            : 'Lương cạnh tranh'}
                      </span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-snug mb-0.5">{job.title}</h1>

                {/* Company */}
                <Link href={`/companies/${job.company.id}`} className="text-sm font-semibold text-[#00b14f] hover:underline">
                  {job.company.name}
                </Link>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 mt-2.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    {job.ward?.name || 'Phú Quốc'}
                  </span>
                  {job.deadline && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Hạn: {new Date(job.deadline).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    {job.quantity} vị trí
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                {!checkAplicated() ? (
                  <button
                    onClick={handleApplyClick}
                    className="apply-btn bg-[#00b14f] hover:bg-[#009940] text-white font-semibold text-sm px-5 py-2.5 rounded-xl cursor-pointer hidden md:block"
                  >
                    Ứng tuyển ngay
                  </button>
                ) : (
                  <div className="hidden md:flex items-center gap-2">
                    <button className="apply-btn bg-gray-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl cursor-not-allowed">
                      Đã ứng tuyển
                    </button>
                    {(userApplication?.status === 'PENDING' || userApplication?.status === 'REVIEWING') && (
                      <button
                        onClick={handleCancelApplication}
                        disabled={applyLoading}
                        className="apply-btn bg-red-500 hover:bg-red-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
                      >
                        {applyLoading ? 'Đang hủy...' : 'Hủy ứng tuyển'}
                      </button>
                    )}
                  </div>
                )}
                <button
                  onClick={handleToggleSave}
                  disabled={saveLoading}
                  title={isSaved ? 'Bỏ lưu' : 'Lưu việc làm'}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer disabled:opacity-50 ${isSaved ? 'bg-[#00b14f] border-[#00b14f] text-white' : 'border-gray-200 text-gray-400 hover:border-[#00b14f] hover:text-[#00b14f]'
                    }`}
                >
                  <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile apply button */}
            <div className="mt-4 md:hidden">
              {!checkAplicated() ? (
                <button
                  onClick={handleApplyClick}
                  className="apply-btn w-full bg-[#00b14f] hover:bg-[#009940] text-white font-semibold text-sm py-3 rounded-xl cursor-pointer"
                >
                  Ứng tuyển ngay
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <button className="w-full bg-gray-700 text-white font-semibold text-sm py-3 rounded-xl cursor-not-allowed">
                    Đã ứng tuyển
                  </button>
                  {(userApplication?.status === 'PENDING' || userApplication?.status === 'REVIEWING') && (
                    <button
                      onClick={handleCancelApplication}
                      disabled={applyLoading}
                      className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-3 rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      {applyLoading ? 'Đang hủy...' : 'Hủy ứng tuyển'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Highlights Strip ────────────────────────── */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  ),
                  label: 'Mức lương',
                  value: formatSalary(job.salaryMin, job.salaryMax),
                },
                {
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  ),
                  label: 'Kinh nghiệm',
                  value: getExperienceLabel(job.experience),
                },
                {
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                  ),
                  label: 'Hình thức',
                  value: getJobTypeLabel(job.type),
                },
                {
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  ),
                  label: 'Số lượng',
                  value: `${job.quantity} người`,
                },
              ].map(item => (
                <div key={item.label} className="highlight-card bg-[#f8faf9] rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#00b14f] flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 font-medium">{item.label}</div>
                    <div className="text-xs font-semibold text-gray-800 mt-0.5 leading-tight">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {salaryAnalysis && (
          <div className="max-w-5xl mx-auto px-4 md:px-6 mt-4">
            <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all duration-300 ${
              salaryAnalysis.status === 'good'
                ? 'bg-[#E6F9F0]/60 border-[#B2ECD0] text-[#004D26]'
                : salaryAnalysis.status === 'bad'
                  ? 'bg-[#FFF9E6]/60 border-[#FFEBAA] text-[#664800]'
                  : 'bg-[#EEF2FF]/60 border-[#C7D2FE] text-[#3730A3]'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${
                salaryAnalysis.status === 'good'
                  ? 'bg-[#B2ECD0] text-[#008040]'
                  : salaryAnalysis.status === 'bad'
                    ? 'bg-[#FFEBAA] text-[#B37D00]'
                    : 'bg-[#C7D2FE] text-[#4F46E5]'
              }`}>
                {salaryAnalysis.status === 'good' ? '✨' : salaryAnalysis.status === 'bad' ? '⚠️' : 'ℹ️'}
              </div>
              <div className="flex-1 text-xs">
                <div className="font-bold flex items-center gap-1.5">
                  Đánh giá mức lương
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                    salaryAnalysis.status === 'good'
                      ? 'bg-[#B2ECD0] text-[#004D26]'
                      : salaryAnalysis.status === 'bad'
                        ? 'bg-[#FFEBAA] text-[#664800]'
                        : 'bg-[#C7D2FE] text-[#3730A3]'
                  }`}>
                    {salaryAnalysis.status === 'good' ? 'Rất tốt' : salaryAnalysis.status === 'bad' ? 'Dưới trung bình' : 'Cạnh tranh'}
                  </span>
                </div>
                <p className="mt-1 text-gray-600 leading-relaxed">{salaryAnalysis.comparisonMessage}</p>
                <p className="mt-1.5 text-[10px] text-gray-400">
                  Mô hình ước tính dựa trên dữ liệu hồi quy tuyến tính từ các tin tuyển dụng tương đồng về cấp bậc, ngành nghề, khu vực và kinh nghiệm trên hệ thống. Cập nhật tự động định kỳ 7 ngày.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Body ────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

            {/* Left: content */}
            <div className="lg:col-span-2 flex flex-col gap-4">

              {/* Tabs */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100">
                  {tabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`tab-btn flex-1 py-3.5 text-sm font-semibold transition-colors cursor-pointer ${activeTab === tab.key
                        ? 'text-[#00b14f] border-b-2 border-[#00b14f] bg-green-50/40'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-6 fade-in">
                  {activeTab === 'description' && (
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {job.description}
                    </div>
                  )}
                  {activeTab === 'requirements' && job.requirements && (
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {job.requirements}
                    </div>
                  )}
                  {activeTab === 'benefits' && job.benefits && (
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {job.benefits}
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#00b14f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  Địa điểm làm việc
                </h3>
                <p className="text-sm text-gray-600">
                  {[job.addressDetail, job.ward?.name, 'Phú Quốc', 'Kiên Giang'].filter(Boolean).join(', ')}
                </p>
                {job.latitude !== null && job.longitude !== null && (
                  <JobMapDisplay
                    latitude={job.latitude}
                    longitude={job.longitude}
                    companyName={job.company.name}
                    address={[job.addressDetail, job.ward?.name].filter(Boolean).join(', ')}
                  />
                )}
              </div>
            </div>

            {/* Right: sidebar */}
            <div className="flex flex-col gap-4">

              {/* CTA card */}
              <div className="bg-[#065f36] rounded-2xl p-5 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/5 translate-y-6 -translate-x-6" />
                <div className="relative z-10">
                  <p className="text-white font-bold text-sm mb-1">Đừng bỏ lỡ cơ hội này!</p>
                  <p className="text-white/60 text-xs mb-4 leading-relaxed">Phản hồi phỏng vấn trong 2–3 ngày làm việc.</p>
                  {!checkAplicated() ? (
                    <button
                      onClick={handleApplyClick}
                      className="apply-btn w-full bg-[#00b14f] hover:bg-[#009940] text-white font-semibold text-sm py-3 rounded-xl cursor-pointer"
                    >
                      Nộp hồ sơ ngay
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button className="w-full bg-[#00b14f]/30 text-white/70 font-semibold text-sm py-3 rounded-xl cursor-not-allowed">
                        Đã nộp hồ sơ
                      </button>
                      {(userApplication?.status === 'PENDING' || userApplication?.status === 'REVIEWING') && (
                        <button
                          onClick={handleCancelApplication}
                          disabled={applyLoading}
                          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-3 rounded-xl cursor-pointer disabled:opacity-50"
                        >
                          {applyLoading ? 'Đang hủy...' : 'Hủy ứng tuyển'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Company card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {job.company.logo ? (
                      <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-xl">🏢</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900 leading-tight">{job.company.name}</p>
                    <p className="text-xs text-[#00b14f] mt-0.5">{job.company.industry || 'Khách sạn & Du lịch'}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 border-t border-gray-100 pt-4">
                  {[
                    { label: 'Quy mô', value: job.company.size || 'Đang cập nhật' },
                    { label: 'Địa điểm', value: job.company.ward?.name || 'Dương Đông' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">{row.label}</span>
                      <span className="text-xs font-semibold text-gray-700">{row.value}</span>
                    </div>
                  ))}
                  {job.company.website && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Website</span>
                      <a href={job.company.website} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#00b14f] hover:underline">
                        Truy cập →
                      </a>
                    </div>
                  )}
                </div>

                {job.company.description && (
                  <p className="text-xs text-gray-400 leading-relaxed mt-4 border-t border-gray-100 pt-4 italic">
                    {job.company.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Related Jobs Section ───────────────────── */}
          <div className="border-t border-gray-150 pt-8 mt-8">
            <h2 className="text-base font-bold text-gray-950 mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#00b14f]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Việc làm liên quan dành cho bạn
            </h2>
            {relatedLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-[#00b14f] border-t-transparent animate-spin" />
              </div>
            ) : relatedJobs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Chưa có công việc tương tự nào khác.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedJobs.map((item: any) => (
                  <Link href={`/jobs/${item.slug}`} key={item.id} className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#00b14f] transition-all duration-300 hover:shadow-sm flex gap-4 cursor-pointer">
                    <div className="w-12 h-12 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.company.logo ? (
                        <img src={item.company.logo} alt={item.company.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-xl">🏢</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 truncate mb-0.5 hover:text-[#00b14f] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs font-semibold text-gray-400 truncate mb-2">{item.company.name}</p>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <span className="bg-[#f4f7f5] px-2 py-0.5 rounded text-gray-600 font-medium">
                          {formatSalary(item.salaryMin, item.salaryMax)}
                        </span>
                        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium">
                          {getJobTypeLabel(item.type)}
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                          {item.ward?.name || 'Phú Quốc'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Cancel Success Modal ────────────────────── */}
        {cancelSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-100 text-center animate-[scaleUp_0.25s_ease]"
              style={{ animation: 'scaleUp 0.2s ease' }}>
              <style>{`@keyframes scaleUp { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Hủy thành công</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Bạn đã hủy đơn ứng tuyển thành công.
              </p>
            </div>
          </div>
        )}

        {/* ── Cancel Confirm Modal ─────────────────────── */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-100 animate-[slideUp_0.25s_ease]"
              style={{ animation: 'slideUp 0.2s ease' }}>
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 text-center mb-2">Hủy ứng tuyển</h3>
              <p className="text-xs text-gray-500 text-center mb-6 leading-relaxed">
                Bạn có chắc chắn muốn hủy đơn ứng tuyển cho công việc này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    confirmCancelApplication();
                  }}
                  disabled={applyLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Xác nhận hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Apply Modal ─────────────────────────────── */}
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease]"
              style={{ animation: 'slideUp 0.25s ease' }}>
              <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>

              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Ứng tuyển vị trí</h3>
                  <p className="text-xs text-[#00b14f] font-semibold mt-0.5">{job.title} · {job.company.name}</p>
                </div>
                <button onClick={() => setShowApplyModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              {applySuccess ? (
                <div className="py-14 text-center flex flex-col items-center gap-3 px-6">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-1">
                    <svg className="w-8 h-8 text-[#00b14f]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <h4 className="text-base font-bold text-gray-900">Ứng tuyển thành công!</h4>
                  <p className="text-sm text-gray-500">Hồ sơ đã được gửi. Nhà tuyển dụng sẽ liên hệ sớm nhất.</p>
                </div>
              ) : quizPhase === 'info' ? (
                <div className="p-6 flex flex-col gap-5 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#0052CC]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Yêu cầu kiểm tra năng lực</h4>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      Để ứng tuyển vị trí này, nhà tuyển dụng yêu cầu bạn hoàn thành một bài trắc nghiệm nhanh. Kết quả sẽ được lưu cùng hồ sơ ứng tuyển của bạn.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl text-left">
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold block uppercase">Tên bài thi</span>
                      <span className="text-xs font-bold text-gray-800">{quizData?.title}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold block uppercase">Thời gian làm bài</span>
                      <span className="text-xs font-bold text-gray-800">{quizData?.timeLimit} phút</span>
                    </div>
                    <div className="col-span-2 border-t border-gray-150 pt-2.5 mt-1">
                      <span className="text-[10px] text-gray-400 font-semibold block uppercase">Số lượng câu hỏi</span>
                      <span className="text-xs font-bold text-gray-800">{quizQuestions.length} câu hỏi trắc nghiệm</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setQuizPhase('none')}
                      className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 font-semibold hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTimeLeft(quizData.timeLimit * 60);
                        setQuizPhase('quiz');
                        setQuizStartTime(Date.now());
                        setCurrentQuestionIndex(0);
                      }}
                      className="flex-1 py-3 bg-[#00b14f] hover:bg-[#009940] text-white rounded-xl text-sm font-semibold cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      Bắt đầu làm bài
                    </button>
                  </div>
                </div>
              ) : quizPhase === 'quiz' && quizQuestions.length > 0 ? (
                <div className="p-6 flex flex-col gap-4">
                  {/* Timer & Progress */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-xs font-semibold text-gray-500">
                      Câu hỏi {currentQuestionIndex + 1} / {quizQuestions.length}
                    </span>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        <path d="M12 6v6l4 2" strokeWidth={2} />
                      </svg>
                      {formatTime(timeLeft)}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#00b14f] h-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                    />
                  </div>

                  {/* Question Box */}
                  <div className="my-2">
                    <h4 className="text-sm font-bold text-gray-900 leading-snug mb-4">
                      {quizQuestions[currentQuestionIndex].content}
                    </h4>

                    {/* Options */}
                    <div className="flex flex-col gap-2.5">
                      {quizQuestions[currentQuestionIndex].options.map((opt: string, idx: number) => {
                        const qId = quizQuestions[currentQuestionIndex].id;
                        const isSelected = selectedAnswers[qId] === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedAnswers(prev => ({ ...prev, [qId]: idx }))}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'border-[#00b14f] bg-green-50/40 text-[#00b14f] font-semibold'
                                : 'border-gray-150 hover:border-gray-300 hover:bg-gray-50/50 text-gray-700'
                            }`}
                          >
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border mr-3 text-[10px] font-bold transition-colors ${
                              isSelected ? 'border-[#00b14f] bg-[#00b14f] text-white' : 'border-gray-300 text-gray-400 bg-white'
                            }`}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation footer */}
                  <div className="flex gap-3 pt-3 border-t border-gray-100 mt-2">
                    <button
                      type="button"
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                      className="px-4 py-3 border border-gray-200 rounded-xl text-xs text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-45 cursor-pointer transition-colors"
                    >
                      Quay lại
                    </button>

                    <div className="flex-1" />

                    {currentQuestionIndex < quizQuestions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        className="px-6 py-3 bg-[#00b14f] hover:bg-[#009940] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Tiếp theo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleQuizSubmit(false)}
                        disabled={applyLoading}
                        className="px-6 py-3 bg-[#00b14f] hover:bg-[#009940] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {applyLoading ? 'Đang nộp...' : 'Nộp bài & Ứng tuyển'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="p-6 flex flex-col gap-4">

                  {/* CV selection */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Chọn CV ứng tuyển</label>
                    {userResumes.length > 0 ? (
                      <select
                        value={selectedResumeId}
                        onChange={e => setSelectedResumeId(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-[#00b14f] transition-colors cursor-pointer"
                      >
                        <option value="">-- Chọn CV đã tạo --</option>
                        {userResumes.map((r: any) => (
                          <option key={r.id} value={r.id}>{r.title}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="border border-dashed border-green-200 bg-green-50/50 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-2">Bạn chưa có CV trên hệ thống</p>
                        <button type="button" onClick={() => router.push('/tao-cv')}
                          className="text-xs font-semibold bg-[#00b14f] text-white px-4 py-1.5 rounded-lg hover:bg-[#009940] cursor-pointer transition-colors">
                          Tạo CV ngay
                        </button>
                      </div>
                    )}
                  </div>

                  {/* File upload */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Hoặc tải CV từ máy (PDF, Word)</label>
                    <label className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-[#00b14f] transition-colors bg-gray-50/50">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      <span className="text-xs text-gray-500 flex-1">{cvFile ? cvFile.name : 'Chọn file...'}</span>
                      <input type="file" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files?.[0] || null)} className="hidden" />
                      <span className="text-xs text-[#00b14f] font-semibold">Tải lên</span>
                    </label>
                  </div>

                  {/* Cover letter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Thư giới thiệu <span className="font-normal text-gray-400">(tuỳ chọn)</span></label>
                    <textarea
                      value={coverLetter}
                      onChange={e => setCoverLetter(e.target.value)}
                      rows={4}
                      placeholder="Giới thiệu ngắn về bản thân và lý do bạn phù hợp..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 resize-none outline-none focus:border-[#00b14f] transition-colors placeholder-gray-300"
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setShowApplyModal(false)}
                      className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 font-semibold hover:bg-gray-50 cursor-pointer transition-colors">
                      Huỷ
                    </button>
                    <button type="submit"
                      disabled={applyLoading || (!selectedResumeId && !cvFile)}
                      className="flex-1 py-3 bg-[#00b14f] hover:bg-[#009940] text-white rounded-xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {applyLoading ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang tải bài thi...</>
                      ) : (job?.quizId ? 'Tiếp tục làm bài test' : 'Gửi hồ sơ')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}