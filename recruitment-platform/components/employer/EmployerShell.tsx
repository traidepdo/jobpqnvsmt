'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NotificationBell from './NotificationBell';

interface CompanyInfo {
  name: string;
  isApproved: boolean;
  logo?: string | null;
}

const NAV = [
  { href: '/employer/dashboard', label: 'Tổng quan', icon: 'dashboard' },
  { href: '/employer/jobs', label: 'Tin tuyển dụng', icon: 'work' },
  { href: '/employer/jobs/new', label: 'Đăng tin mới', icon: 'add_circle' },
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
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  // Thêm state
  const [unreadSupport, setUnreadSupport] = useState(0);

  const loadUnreadSupport = () => {
    fetch('/api/employer/admin-conversations/unread')
      .then(r => r.json())
      .then(d => setUnreadSupport(d.unread ?? 0))
      .catch(() => { });
  };

  useEffect(() => {
    loadUnreadSupport();
    const interval = setInterval(
      loadUnreadSupport,
      pathname.startsWith('/employer/support') ? 3000 : 15000
    );
    return () => clearInterval(interval);
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

    // Cập nhật badge ngay khi employer đọc tin nhắn
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
        if (d.user.company) setCompany(d.user.company);
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

  return (
    <div className="flex min-h-screen bg-[#f0f4ff]">

      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-[68px]'} flex-shrink-0 flex flex-col transition-all duration-300 bg-white border-r border-gray-100 shadow-sm`}>

        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-gray-100 flex-shrink-0 ${sidebarOpen ? 'px-5 gap-3' : 'justify-center'}`}>
          <Link href="/" className="flex items-center gap-1.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#0052CC] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-extrabold text-sm">PQ</span>
            </div>
            {sidebarOpen && (
              <span className="font-extrabold text-lg text-[#041b3c] group-hover:opacity-80 transition-opacity">
                Jobs<span className="text-[#0052CC]">.</span>
              </span>
            )}
          </Link>
        </div>

        {/* Company card */}
        {sidebarOpen ? (
          <div className="mx-3 mt-4 p-3 rounded-xl bg-[#f0f4ff] border border-[#0052CC]/10">
            <div className="flex items-center gap-3">
              {company?.logo ? (
                <img src={company.logo} alt="" className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border border-gray-100 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#0052CC] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {company?.name?.[0] ?? 'C'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#041b3c] truncate">{company?.name ?? 'Công ty'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${company?.isApproved ? 'bg-[#00b14f]' : 'bg-amber-400'}`} />
                  <span className={`text-[11px] font-medium ${company?.isApproved ? 'text-[#00b14f]' : 'text-amber-500'}`}>
                    {company?.isApproved ? 'Đã xác minh' : 'Chờ duyệt'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mt-4">
            {company?.logo ? (
              <img src={company.logo} alt="" className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border border-gray-100" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#0052CC] flex items-center justify-center text-white font-bold">
                {company?.name?.[0] ?? 'C'}
              </div>
            )}
          </div>
        )}

        {/* Nav label */}
        {sidebarOpen && (
          <p className="px-4 mt-5 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Quản lý
          </p>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(item => {
            const active =
              pathname === item.href ||
              (item.href === '/employer/jobs' &&
                pathname.startsWith('/employer/jobs/') &&
                pathname !== '/employer/jobs/new');
            const isMessages = item.href === '/employer/messages';
            const isSupport = item.href === '/employer/support';

            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group
                  ${active
                    ? 'bg-[#0052CC] text-white shadow-sm shadow-[#0052CC]/30'
                    : 'text-gray-500 hover:bg-[#f0f4ff] hover:text-[#0052CC]'
                  }
                  ${!sidebarOpen ? 'justify-center' : ''}
                `}
              >
                {/* Icon + badge khi collapsed */}
                <div className="relative flex-shrink-0">
                  <span className={`material-symbols-outlined text-[20px] transition-colors
                    ${active ? 'text-white' : 'text-gray-400 group-hover:text-[#0052CC]'}`}>
                    {item.icon}
                  </span>
                  {!sidebarOpen && isMessages && unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </div>

                {/* Label */}
                {sidebarOpen && <span className="truncate">{item.label}</span>}

                {/* Badge số khi expanded */}
                {sidebarOpen && isMessages && unreadMessages > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                    ${active ? 'bg-white text-[#0052CC]' : 'bg-red-500 text-white'}`}>
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}

                {/* Active dot khi collapsed */}
                {!sidebarOpen && active && !isMessages && (
                  <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#0052CC]" />
                )}


                {sidebarOpen && isSupport && unreadSupport > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                    ${active ? 'bg-white text-[#0052CC]' : 'bg-red-500 text-white'}`}>
                    {unreadSupport > 99 ? '99+' : unreadSupport}
                  </span>
                )}

                {!sidebarOpen && isSupport && unreadSupport > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center">
                    {unreadSupport > 9 ? '9+' : unreadSupport}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 space-y-2 border-t border-gray-100">
          {sidebarOpen && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#0052CC] to-[#0040a2] text-white">
              <p className="text-xs font-bold mb-1">Nâng cấp Pro</p>
              <p className="text-[10px] text-white/70 mb-2">Đăng tin không giới hạn & xem CV ứng viên</p>
              <button className="w-full py-1.5 bg-white text-[#0052CC] text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors">
                Xem gói Pro
              </button>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer
              ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {sidebarOpen && 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {sidebarOpen ? 'menu_open' : 'menu'}
              </span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 hidden sm:block">Nhà tuyển dụng</span>
              <span className="material-symbols-outlined text-[14px] text-gray-300 hidden sm:block">chevron_right</span>
              <h1 className="text-sm font-bold text-[#041b3c]">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/employer/jobs/new"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-[#0052CC] hover:bg-[#0040a2] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#0052CC]/20 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Đăng tin mới
            </Link>

            <NotificationBell />

            <div className="relative" data-user-menu>
              <button
                onClick={() => setUserMenuOpen(p => !p)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-[#0052CC] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {userName?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="text-sm font-semibold text-[#041b3c] hidden sm:block max-w-[120px] truncate">
                  {userName || 'Tài khoản'}
                </span>
                <span className="material-symbols-outlined text-[16px] text-gray-400">keyboard_arrow_down</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 py-1">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-sm font-bold text-[#041b3c] truncate">{userName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Nhà tuyển dụng</p>
                  </div>
                  <Link href="/employer/company"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#0052CC] transition-colors">
                    <span className="material-symbols-outlined text-[18px]">business</span>
                    Hồ sơ công ty
                  </Link>
                  <Link href="/employer/settings"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#0052CC] transition-colors">
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    Cài đặt
                  </Link>
                  <div className="border-t border-gray-50 mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
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

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}