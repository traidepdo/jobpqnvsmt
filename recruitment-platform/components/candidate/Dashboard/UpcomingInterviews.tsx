import React from 'react';
import Link from 'next/link';
import { requireCandidate } from '@/lib/requireCandidate';
import { getInterviews } from '@/lib/services/candidate/interviews';
import { redirect } from 'next/navigation';

export default async function UpcomingInterviews() {
  const authResult = await requireCandidate();
  if (authResult.error) {
    redirect('/login');
  }
  const userId = authResult.payload.id;

  const allInterviews = await getInterviews({ id: userId });
  // Filter for interviews that are either today or in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = allInterviews.filter(
    (iv) => new Date(iv.scheduledAt) >= today && iv.status !== 'CANCELLED' && iv.candidateStatus !== 'DECLINED'
  ).slice(0, 3); // Take top 3 upcoming

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-slate-200 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-[#041b3c] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#00b14f] text-[20px]">event</span>
          Lịch phỏng vấn sắp tới
        </h3>
        <Link href="/candidate/interviews" className="text-xs font-semibold text-[#00b14f] hover:underline">
          Xem lịch
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center">
          <span className="material-symbols-outlined text-slate-300 text-[32px] mb-1 block">calendar_today</span>
          <p className="text-xs text-slate-400 mb-3">Không có lịch phỏng vấn nào sắp tới.</p>
          <Link href="/jobs" className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#00b14f] hover:bg-[#009940] text-white text-[11px] font-bold rounded-lg transition-colors">
            Tìm việc phù hợp
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((iv) => {
            const date = new Date(iv.scheduledAt);
            const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            
            return (
              <div key={iv.id} className="p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 transition-colors">
                <div className="w-12 h-12 bg-white rounded-lg flex-shrink-0 flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Th{date.getMonth() + 1}</span>
                  <span className="text-base font-black text-slate-700 -mt-1">{date.getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{iv.application.job.title}</p>
                  <p className="text-[11px] text-slate-500 truncate">{iv.application.job.company.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {timeStr}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 capitalize">
                      <span className="material-symbols-outlined text-[12px]">videocam</span>
                      {iv.type === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp'}
                    </span>
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
