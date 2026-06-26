import Link from 'next/link';
import StatCard from '@/components/candidate/Dashboard/statCard';
import CvApplications from '@/components/candidate/Dashboard/CvApplications';
import QuickAccess from '@/components/candidate/Dashboard/QuickAccess';

export default async function CandidateDashboardPage() {
  return (
    <div className="space-y-6 w-full">
      <div className="bg-gradient-to-r from-[#00b14f] to-[#009940] rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-1">Chào mừng trở lại!</h2>
        <p className="text-white/80 text-sm mb-5">Quản lý CV, đơn ứng tuyển và việc làm đã lưu tại một nơi.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/jobs" className="px-4 py-2 bg-white text-[#00b14f] font-bold rounded-lg text-sm hover:bg-white/90">
            Tìm việc làm
          </Link>
          <Link href="/tao-cv" className="px-4 py-2 bg-white/20 border border-white/40 font-bold rounded-lg text-sm hover:bg-white/30">
            Tạo CV mới
          </Link>
        </div>
      </div>
      <StatCard />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CvApplications />
        <QuickAccess />
      </div>
    </div>
  );
}
