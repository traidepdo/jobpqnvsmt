import Link from 'next/link';
import StatCard from '@/components/candidate/Dashboard/statCard';
import CvApplications from '@/components/candidate/Dashboard/CvApplications';
import QuickAccess from '@/components/candidate/Dashboard/QuickAccess';
import UpcomingInterviews from '@/components/candidate/Dashboard/UpcomingInterviews';
import RecentActivities from '@/components/candidate/Dashboard/RecentActivities';
import { requireCandidate } from '@/lib/requireCandidate';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function CandidateDashboardPage() {
  const authResult = await requireCandidate();
  if (authResult.error) {
    redirect('/login');
  }
  const userId = authResult.payload.id;

  // Calculate profile completion percentage dynamically
  const candidateUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true, name: true, phone: true }
  });

  const defaultResume = await prisma.resume.findFirst({
    where: { userId, isDefault: true },
    select: { profileSummary: true, profileExperience: true }
  }) || await prisma.resume.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: { profileSummary: true, profileExperience: true }
  });

  let score = 0;
  if (candidateUser?.avatar) score += 20;
  if (candidateUser?.name) score += 20;
  if (candidateUser?.phone) score += 20;
  if (defaultResume?.profileSummary) score += 20;
  if (defaultResume?.profileExperience && Array.isArray(defaultResume.profileExperience) && defaultResume.profileExperience.length > 0) {
    score += 20;
  }
  const progressFraction = score / 100;

  return (
    <div className="space-y-8 w-full max-w-[1300px] mx-auto pb-10">
      
      {/* 1. BANNER CHÀO MỪNG */}
      <div className="bg-gradient-to-r from-[#00b14f] to-[#009940] rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        
        {/* Left Side: Content & Action */}
        <div className="flex-1 z-10">
          <h2 className="text-2xl font-black mb-1.5 flex items-center gap-2">
            Chào mừng trở lại! 👋
          </h2>
          <p className="text-white/85 text-sm mb-6 max-w-lg leading-relaxed">
            Quản lý CV, các đơn ứng tuyển và xem thông báo việc làm phù hợp nhất cho bạn tại một nơi thống nhất.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/jobs" className="px-5 py-2.5 bg-white text-[#00b14f] font-bold rounded-xl text-xs hover:bg-white/95 transition-all active:scale-95 shadow-sm">
              Tìm việc làm
            </Link>
            <Link href="/tao-cv" className="px-5 py-2.5 bg-white/20 border border-white/30 font-bold rounded-xl text-xs hover:bg-white/30 transition-all active:scale-95">
              Tạo CV mới
            </Link>
          </div>
        </div>

        {/* Right Side: Profile completion ring progress */}
        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 z-10 w-full md:w-auto md:min-w-[240px]">
          <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" className="stroke-white/20" strokeWidth="5" fill="transparent" />
              <circle cx="32" cy="32" r="28" className="stroke-white" strokeWidth="5" fill="transparent" strokeDasharray={2 * Math.PI * 28} strokeDashoffset={2 * Math.PI * 28 * (1 - progressFraction)} />
            </svg>
            <span className="text-sm font-black">{score}%</span>
          </div>
          <div>
            <p className="text-xs font-bold text-white">Độ hoàn thiện hồ sơ</p>
            <p className="text-[10px] text-white/70 mt-0.5 leading-snug">
              {score === 100 ? 'Hồ sơ đã đạt 100%! Tuyệt vời!' : 'Cập nhật đầy đủ thông tin để tăng 3x cơ hội phỏng vấn.'}
            </p>
          </div>
        </div>

        {/* Subtle background decoration */}
        <div className="absolute right-0 bottom-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -z-0 pointer-events-none" />
      </div>

      {/* 2. THẺ THỐNG KÊ */}
      <div className="pt-2">
        <StatCard />
      </div>

      {/* 3. BỐ CỤC 2 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* CỘT TRÁI (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <CvApplications />
          <RecentActivities />
        </div>

        {/* CỘT PHẢI (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          <QuickAccess />
          <UpcomingInterviews />
        </div>

      </div>

    </div>
  );
}
