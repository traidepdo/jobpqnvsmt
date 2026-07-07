'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NotificationBell from "@/components/candidate/NotificationBell";
import PusherBeamsInitializer from "@/components/PusherBeamsInitializer";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

const NAV_GROUPS = [
  {
    label: 'Thông tin chung',
    items: [
      { href: '/candidate/dashboard', label: 'Tổng quan', icon: 'dashboard' },
      { href: '/candidate/notifications', label: 'Thông báo', icon: 'notifications' },
      { href: '/candidate/messages', label: 'Tin nhắn', icon: 'chat' },
    ],
  },
  {
    label: 'Tìm kiếm',
    items: [
      { href: '/jobs', label: 'Tìm việc làm', icon: 'search', badge: 'Mới' },
      { href: '/candidate/saved', label: 'Việc đã lưu', icon: 'bookmark' },
      { href: '/candidate/follow-employer', label: 'Theo dõi nhà tuyển dụng', icon: 'group' },
    ],
  },
  {
    label: 'Hồ sơ của tôi',
    items: [
      { href: '/candidate/applications', label: 'Đơn ứng tuyển', icon: 'description' },
      { href: '/candidate/resumes', label: 'CV đã tạo', icon: 'badge' },
      { href: '/tao-cv', label: 'Tạo CV mới', icon: 'add_circle' },
      { href: '/candidate/interviews', label: 'Lịch phỏng vấn', icon: 'event' },
    ],
  },
  {
    label: "Quản lý tài khoản",
    items: [
      { href: '/candidate/user', label: 'Thông tin cá nhân', icon: 'person' },
      { href: '/candidate/reset-password', label: 'Đổi mật khẩu', icon: 'lock' },
    ],
  },
];

export default function CandidateShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  // Lấy tổng số tin nhắn chưa đọc
  const loadUnread = () => {
    fetch('/api/candidate/conversations')
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

  const loadUnreadNotifications = () => {
    fetch('/api/candidate/notifications')
      .then(r => r.json())
      .then(d => {
        const total = (d.notifications ?? []).filter((n: { isRead: boolean }) => !n.isRead).length;
        setUnreadNotifications(total);
      })
      .catch(() => { });
  };

  useEffect(() => {
    loadUnread();
    loadUnreadNotifications();
    const interval = setInterval(() => {
      loadUnread();
      loadUnreadNotifications();
    }, 10000);

    // Lắng nghe event từ messages page khi user đọc tin
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
        if (d.user) {
          setUser(d.user);
          setLoading(false);
        }
        else router.push('/login?callbackUrl=' + encodeURIComponent(pathname));
      })
      .catch(() => router.push('/login'));
  }, [pathname, router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const allItems = NAV_GROUPS.flatMap(g => g.items);
  const pageTitle =
    title ??
    allItems.find(
      n => pathname === n.href || (n.href !== '/jobs' && pathname.startsWith(n.href + '/'))
    )?.label ??
    'Quản lý hồ sơ';

  const initials =
    user?.name
      ?.split(' ')
      .filter(Boolean)
      .slice(-2)
      .map(w => w[0].toUpperCase())
      .join('') ?? '?';

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f4f7f6]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium animate-pulse">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7f6]">
      {user?.id && <PusherBeamsInitializer userId={user.id} />}
      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 
          ${mobileOpen ? 'translate-x-0 w-[240px]' : '-translate-x-full md:translate-x-0'} 
          ${collapsed ? 'md:w-[68px]' : 'md:w-[240px]'} md:relative flex-shrink-0`}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100 flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#00b14f] flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-[16px]">layers</span>
          </div>
          <span className={`text-[17px] font-medium text-gray-900 transition-all duration-300 overflow-hidden whitespace-nowrap ${
            (collapsed && !mobileOpen) ? 'w-0 opacity-0 invisible' : 'w-auto opacity-100 visible'
          }`}>
            PQ<span className="text-[#00b14f]">Jobs</span>
          </span>
        </div>

        {/* User card */}
        <div className="m-3 overflow-hidden">
          <div
            className={`bg-[#f0faf4] border border-[#b6e8c9] rounded-xl flex items-center gap-2.5 p-3 transition-all duration-300 ${
              (collapsed && !mobileOpen) ? 'justify-center !p-2' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#00b14f] flex items-center justify-center text-white text-sm font-medium flex-shrink-0 transition-all duration-300">
              {user?.avatar ? <img src={user.avatar} alt="" className="rounded-[10px]" /> : initials}
            </div>
            <div className={`min-w-0 transition-all duration-300 overflow-hidden whitespace-nowrap ${
              (collapsed && !mobileOpen) ? 'w-0 opacity-0 invisible' : 'w-auto opacity-100 visible'
            }`}>
              <p className="text-[13px] font-medium text-[#065f36] truncate">{user?.name ?? '...'}</p>
              <p className="text-[11px] text-[#2d9d62] truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-1 space-y-0.5 overflow-y-auto">
          {NAV_GROUPS.map((group, index) => (
            <div key={group.label} className="transition-all duration-300">
              {index > 0 && (
                <div className={`mx-2 border-t border-gray-100 transition-all duration-300 ${
                  (collapsed && !mobileOpen) ? 'my-3' : 'my-2'
                }`} />
              )}
              <p className={`text-[10px] font-medium text-gray-400 uppercase tracking-[0.6px] px-2 transition-all duration-300 overflow-hidden whitespace-nowrap ${
                (collapsed && !mobileOpen) ? 'h-0 opacity-0 py-0 invisible' : 'h-auto opacity-100 pt-3 pb-1 visible'
              }`}>
                {group.label}
              </p>
              {group.items.map(item => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/jobs' && pathname.startsWith(item.href + '/'));
                const isMessages = item.href === '/candidate/messages';
                const isNotifications = item.href === '/candidate/notifications';

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13px] font-medium transition-colors ${(collapsed && !mobileOpen) ? 'justify-center' : ''
                      } ${active
                        ? 'bg-[#e9f7ef] text-[#00a045]'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                      }`}
                  >
                    {/* Icon — với badge khi collapsed */}
                    <div className="relative flex-shrink-0">
                      <span
                        className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${active ? 'text-[#00b14f]' : ''}`}
                      >
                        {item.icon}
                      </span>
                      {/* Badge nhỏ trên icon khi sidebar collapsed */}
                      {(collapsed && !mobileOpen) && isMessages && unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                      )}
                      {(collapsed && !mobileOpen) && isNotifications && unreadNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center">
                          {unreadNotifications > 9 ? '9+' : unreadNotifications}
                        </span>
                      )}
                    </div>

                    {/* Label + badge khi expanded */}
                    <span className={`flex-1 flex items-center justify-between transition-all duration-300 overflow-hidden ${
                      (collapsed && !mobileOpen) ? 'max-w-0 opacity-0 invisible' : 'max-w-[200px] opacity-100 visible'
                    }`}>
                      <span className="truncate">{item.label}</span>

                      {isMessages && unreadMessages > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {unreadMessages > 99 ? '99+' : unreadMessages}
                        </span>
                      )}

                      {isNotifications && unreadNotifications > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {unreadNotifications > 99 ? '99+' : unreadNotifications}
                        </span>
                      )}

                      {!isMessages && !isNotifications && item.badge && (
                        <span className="ml-auto text-[10px] font-medium bg-red-500 text-white rounded-full px-1.5 py-0.5">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2.5 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13px] text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer ${(collapsed && !mobileOpen) ? 'justify-center' : ''
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
              (collapsed && !mobileOpen) ? 'max-w-0 opacity-0 invisible' : 'max-w-[200px] opacity-100 visible'
            }`}>
              Đăng xuất
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center gap-3 px-5">
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileOpen(o => !o);
              } else {
                setCollapsed(o => !o);
              }
            }}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">menu</span>
          </button>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="text-gray-500 hover:text-[#00b14f] transition-colors"
            >
              Trang chủ
            </Link>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>

            <span className="font-semibold text-gray-900">
              {pageTitle}
            </span>
          </nav>
          <div className="ml-2">
            <NotificationBell />
          </div>
          <div className="ml-auto">
            <Link
              href="/tao-cv"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-[7px] bg-[#00b14f] hover:bg-[#009940] text-white text-[13px] font-medium rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Tạo CV mới
            </Link>
          </div>
        </header>

        <main className="flex-1 p-5 overflow-auto">{children}</main>
      </div>
    </div>
  );
}