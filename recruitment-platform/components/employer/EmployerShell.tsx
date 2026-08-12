'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NotificationBell from './NotificationBell';
import PusherBeamsInitializer from '@/components/PusherBeamsInitializer';

interface CompanyInfo {
  name: string;
  isApproved: boolean;
  logo?: string | null;
}

const NAV = [
  { href: '/employer/dashboard', label: 'Tổng quan', icon: 'dashboard' },
  { href: '/employer/notifications', label: 'Thông báo', icon: 'notifications' },
  { href: '/employer/jobs', label: 'Tin tuyển dụng', icon: 'work' },
  { href: '/employer/jobs/new', label: 'Đăng tin mới', icon: 'add_circle' },
  { href: '/employer/quizzes', label: 'Quản lý bài test', icon: 'quiz' },
  { href: '/employer/applications', label: 'Đơn ứng tuyển', icon: 'inbox' },
  { href: '/employer/interviews', label: 'Lịch phỏng vấn', icon: 'calendar_today' },
  { href: '/employer/candidates', label: 'Ứng viên tiềm năng', icon: 'people' },
  { href: '/employer/messages', label: 'Tin nhắn', icon: 'chat' },
  { href: '/employer/company', label: 'Hồ sơ công ty', icon: 'business' },
  { href: '/employer/support', label: 'Support', icon: 'support' },
  { href: '/employer/reset-password', label: 'Đổi mật khẩu', icon: 'password' }

];

export default function EmployerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadSupport, setUnreadSupport] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  // Auto handle sidebar state based on screen size on mount and resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadUnreadSupport = () => {
    fetch('/api/employer/admin-conversations/unread')
      .then(r => r.json())
      .then(d => setUnreadSupport(d.unread ?? 0))
      .catch(() => { });
  };

  const loadUnreadNotifications = () => {
    fetch('/api/employer/notifications')
      .then(r => r.json())
      .then(d => {
        const total = typeof d.unReadCount === 'number'
          ? d.unReadCount
          : (Array.isArray(d.notifications) ? d.notifications.filter((n: { isRead: boolean }) => !n.isRead).length : 0);
        setUnreadNotifications(total);
      })
      .catch(() => { });
  };

  useEffect(() => {
    loadUnreadSupport();
    loadUnreadNotifications();
    const interval = setInterval(
      () => {
        loadUnreadSupport();
        loadUnreadNotifications();
      },
      pathname.startsWith('/employer/support') ? 3000 : 15000
    );

    const onNotifRead = () => loadUnreadNotifications();
    window.addEventListener('notifications:read', onNotifRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications:read', onNotifRead);
    };
  }, [pathname]);

  const loadUnread = () => {
    fetch('/api/employer/conversations')
      .then(r => r.json())
      .then(d => {
        const total = (d.conversations ?? []).reduce(
          (sum: number, c: { unreadCount?: number }) => sum + (c.unreadCount ?? 0),
          0
        );
        setUnreadMessages(total);
      })
      .catch(() => { });
  };

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 10000);

    const onRead = () => loadUnread();
    window.addEventListener('messages:read', onRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener('messages:read', onRead);
    };
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.user || d.user.role !== 'EMPLOYER') {
          router.push('/login?callbackUrl=' + encodeURIComponent(pathname));
          return;
        }
        setUserName(d.user.name);
        setUserId(d.user.id);
        if (d.user.company) setCompany(d.user.company);
        setLoading(false);
      })
      .catch(() => router.push('/login'));
  }, [pathname, router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const pageTitle =
    NAV.find(n => pathname === n.href)?.label ||
    (pathname.includes('/edit') ? 'Sửa tin tuyển dụng' : 'Nhà tuyển dụng');

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f0f4ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#0052CC] rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium animate-pulse">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Close sidebar on navigation change on mobile devices
  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f4ff] relative">
      {userId && <PusherBeamsInitializer userId={userId} />}
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (Responsive Drawer) ── */}
      <aside className={`${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0 md:w-[76px] md:translate-x-0'} fixed md:static inset-y-0 left-0 z-50 flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out bg-white border-r border-slate-100 overflow-hidden`}>

        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-slate-100 flex-shrink-0 px-6 transition-all duration-300 ${sidebarOpen ? 'gap-3 justify-start' : 'justify-center px-0'}`}>
          <Link href="/" className="flex items-center gap-2 group" onClick={handleNavClick}>
            <div className="w-8 h-8 rounded-lg bg-[#0052CC] flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-102">
              <span className="text-white font-bold text-sm">PQ</span>
            </div>
            <span className={`font-extrabold text-base text-[#0f172a] tracking-tight transition-all duration-300 whitespace-nowrap
              ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 pointer-events-none'}`}>
              Jobs<span className="text-[#0052CC]">.</span>
            </span>
          </Link>
        </div>

        {/* Company Card (Minimalist style) */}
        <div className={`mx-4 mt-4 mb-2 p-2 rounded-xl border border-slate-100 bg-slate-50/50 transition-all duration-300 ${sidebarOpen ? 'px-3' : 'px-1 justify-center'}`}>
          <div className="flex items-center gap-3 justify-start">
            {company?.logo ? (
              <img src={company.logo} alt="" className="w-9 h-9 rounded-lg object-contain bg-white border border-slate-100 p-0.5 flex-shrink-0 shadow-sm" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-base flex-shrink-0">
                {company?.name?.[0] ?? 'C'}
              </div>
            )}
            <div className={`min-w-0 transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 pointer-events-none'}`}>
              <p className="text-xs font-bold text-[#0f172a] truncate">{company?.name ?? 'Công ty'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${company?.isApproved ? 'bg-[#00b14f]' : 'bg-amber-400'}`} />
                <span className={`text-[10px] font-semibold ${company?.isApproved ? 'text-[#00b14f]' : 'text-amber-600'}`}>
                  {company?.isApproved ? 'Đã xác minh' : 'Chờ duyệt'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav label */}
        <p className={`px-6 mt-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap transition-all duration-300
          ${sidebarOpen ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden pointer-events-none mt-0 mb-0'}`}>
          Quản lý
        </p>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active =
              pathname === item.href ||
              (item.href === '/employer/jobs' &&
                pathname.startsWith('/employer/jobs/') &&
                pathname !== '/employer/jobs/new');
            const isMessages = item.href === '/employer/messages';
            const isSupport = item.href === '/employer/support';
            const isNotifications = item.href === '/employer/notifications';

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                title={!sidebarOpen ? item.label : undefined}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group
                  ${active
                    ? 'bg-blue-50/80 text-[#0052CC]'
                    : 'text-slate-600 hover:bg-slate-50/80 hover:text-slate-950'
                  }
                `}
              >
                {/* Active Indicator Bar (Left) */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-[#0052CC]" />
                )}

                {/* Icon */}
                <div className="relative flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  <span className={`material-symbols-outlined text-[20px] transition-colors duration-200
                    ${active ? 'text-[#0052CC]' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {item.icon}
                  </span>

                  {/* Badge số khi collapsed */}
                  {!sidebarOpen && isMessages && unreadMessages > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center shadow-sm">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                  {!sidebarOpen && isSupport && unreadSupport > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center shadow-sm">
                      {unreadSupport > 9 ? '9+' : unreadSupport}
                    </span>
                  )}
                  {!sidebarOpen && isNotifications && unreadNotifications > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center shadow-sm">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span className={`whitespace-nowrap transition-all duration-300 ease-in-out truncate font-medium
                  ${sidebarOpen ? 'opacity-100 w-auto ml-0' : 'opacity-0 w-0 pointer-events-none ml-[-12px]'}`}>
                  {item.label}
                </span>

                {/* Badge số khi expanded */}
                {sidebarOpen && isMessages && unreadMessages > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center transition-all duration-300
                    ${active ? 'bg-blue-100 text-[#0052CC]' : 'bg-rose-500 text-white'}`}>
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
                {sidebarOpen && isSupport && unreadSupport > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center transition-all duration-300
                    ${active ? 'bg-blue-100 text-[#0052CC]' : 'bg-rose-500 text-white'}`}>
                    {unreadSupport > 99 ? '99+' : unreadSupport}
                  </span>
                )}
                {sidebarOpen && isNotifications && unreadNotifications > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center transition-all duration-300
                    ${active ? 'bg-blue-100 text-[#0052CC]' : 'bg-rose-500 text-white'}`}>
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 cursor-pointer"
            title={!sidebarOpen ? 'Đăng xuất' : undefined}
          >
            <span className="material-symbols-outlined text-[20px] flex-shrink-0 text-slate-400">logout</span>
            <span className={`whitespace-nowrap transition-all duration-300 font-medium
              ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 pointer-events-none'}`}>
              Đăng xuất
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 border-b border-slate-100 flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-[#0052CC] transition-all cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform duration-200">
                {sidebarOpen ? 'menu_open' : 'menu'}
              </span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400 font-medium hidden sm:block">Nhà tuyển dụng</span>
              <span className="material-symbols-outlined text-[14px] text-slate-300 hidden sm:block">chevron_right</span>
              <h1 className="text-sm font-extrabold text-[#041b3c]">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/employer/jobs/new"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-tr from-[#0052CC] to-[#0073e6] hover:brightness-110 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md shadow-[#0052CC]/15 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Đăng tin mới
            </Link>

            <NotificationBell />

            <div className="relative" data-user-menu>
              <button
                onClick={() => setUserMenuOpen(p => !p)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0052CC] to-[#0073e6] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
                  {userName?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="text-sm font-bold text-[#041b3c] hidden sm:block max-w-[120px] truncate">
                  {userName || 'Tài khoản'}
                </span>
                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-slate-600 transition-colors">keyboard_arrow_down</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100/80 overflow-hidden z-50 py-1.5">
                  <div className="px-4 py-3 border-b border-slate-50">
                    <p className="text-sm font-bold text-[#041b3c] truncate">{userName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Nhà tuyển dụng</p>
                  </div>
                  <Link href="/employer/company"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#0052CC] transition-colors font-medium">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">business</span>
                    Hồ sơ công ty
                  </Link>
                  <Link href="/employer/settings"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-[#0052CC] transition-colors font-medium">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">settings</span>
                    Cài đặt
                  </Link>
                  <div className="border-t border-slate-50 mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}