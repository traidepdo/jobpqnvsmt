import { requireCandidate } from '@/lib/requireCandidate';
import { redirect } from 'next/navigation';
import { getCandidateStats } from '@/lib/services/candidate/dashboard';
import Link from 'next/link';

export default async function StatCard() {
    const authResult = await requireCandidate();
    if (authResult.error) {
        redirect('/login');
    }
    const userId = authResult.payload.id;

    const { applications, savedJobs, resumes, accepted } = await getCandidateStats(userId);

    // Premium Bezier paths and closed area paths for smooth gradient filled waves
    const cards = [
        { 
            label: 'Đã ứng tuyển', 
            value: applications, 
            icon: 'description', 
            color: '#6366f1', 
            href: '/candidate/applications',
            trend: '+2', 
            trendUp: true,
            gradId: 'grad-apply',
            linePath: 'M0 22 C 20 12, 40 28, 60 15 C 80 8, 100 22, 120 8 C 135 18, 145 10, 150 12',
            areaPath: 'M0 22 C 20 12, 40 28, 60 15 C 80 8, 100 22, 120 8 C 135 18, 145 10, 150 12 L 150 30 L 0 30 Z'
        },
        { 
            label: 'Việc đã lưu', 
            value: savedJobs, 
            icon: 'bookmark', 
            color: '#ef4444', 
            href: '/candidate/saved',
            trend: '+1', 
            trendUp: true,
            gradId: 'grad-save',
            linePath: 'M0 25 C 20 18, 40 30, 60 20 C 80 12, 100 5, 120 15 C 135 22, 145 10, 150 8',
            areaPath: 'M0 25 C 20 18, 40 30, 60 20 C 80 12, 100 5, 120 15 C 135 22, 145 10, 150 8 L 150 30 L 0 30 Z'
        },
        { 
            label: 'CV đã tạo', 
            value: resumes, 
            icon: 'article', 
            color: '#00b14f', 
            href: '/candidate/resumes',
            trend: '0', 
            trendUp: null,
            gradId: 'grad-resume',
            linePath: 'M0 20 C 30 20, 60 20, 90 20 C 120 20, 135 20, 150 20',
            areaPath: 'M0 20 C 30 20, 60 20, 90 20 C 120 20, 135 20, 150 20 L 150 30 L 0 30 Z'
        },
        { 
            label: 'Được chấp nhận', 
            value: accepted, 
            icon: 'check_circle', 
            color: '#10b981', 
            href: '/candidate/applications',
            trend: '+1', 
            trendUp: true,
            gradId: 'grad-accept',
            linePath: 'M0 26 C 20 20, 40 15, 60 22 C 80 10, 100 5, 120 8 C 135 4, 145 6, 150 2',
            areaPath: 'M0 26 C 20 20, 40 15, 60 22 C 80 10, 100 5, 120 8 C 135 4, 145 6, 150 2 L 150 30 L 0 30 Z'
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(card => (
                <Link 
                    key={card.label} 
                    href={card.href}
                    className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 block group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start">
                        <span className="material-symbols-outlined text-[28px] group-hover:scale-105 transition-transform duration-300" style={{ color: card.color }}>
                            {card.icon}
                        </span>
                        
                        {/* Trend Indicator */}
                        {card.trendUp !== null && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                                card.trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                            }`}>
                                <span>{card.trendUp ? '↑' : '↓'}</span>
                                <span>{card.trend}</span>
                            </span>
                        )}
                        {card.trendUp === null && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-400">
                                ~ 0
                            </span>
                        )}
                    </div>
                    
                    <div className="flex justify-between items-end mt-4">
                        <div>
                            <p className="text-2xl font-extrabold text-[#041b3c]">{card.value}</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">{card.label}</p>
                        </div>
                        
                        {/* Smooth Gradient Sparkline Chart on the bottom right */}
                        <div className="w-20 h-9 flex items-center justify-center opacity-40 group-hover:opacity-75 transition-opacity">
                            {card.trendUp !== null ? (
                                <svg className="w-full h-full" viewBox="0 0 150 30" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id={card.gradId} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={card.color} stopOpacity="0.4" />
                                            <stop offset="100%" stopColor={card.color} stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {/* Filled Area */}
                                    <path
                                        d={card.areaPath}
                                        fill={`url(#${card.gradId})`}
                                    />
                                    {/* Line */}
                                    <path
                                        d={card.linePath}
                                        fill="none"
                                        stroke={card.color}
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            ) : (
                                <span className="text-slate-300 font-black text-sm tracking-widest select-none bg-slate-50 px-2 py-1 rounded border border-slate-100/60">— Stable</span>
                            )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}