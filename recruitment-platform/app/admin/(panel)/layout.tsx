'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
    href: string;
    icon: string;
    label: string;
    badge?: number;
}
interface NavGroup {
    title: string;
    items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        title: 'Tổng quan',
        items: [
            { href: '/admin/dashboard', icon: '◈', label: 'Dashboard' },
            { href: '/admin/analytics', icon: '◎', label: 'Thống kê' },
        ],
    },
    {
        title: 'Nội dung',
        items: [
            { href: '/admin/jobs', icon: '◷', label: 'Tin tuyển dụng' },
            { href: '/admin/companies', icon: '⬡', label: 'Doanh nghiệp' },
            { href: '/admin/users', icon: '◉', label: 'Người dùng' },
        ],
    },
    {
        title: 'Hệ thống',
        items: [
            { href: '/admin/blog-categories', icon: '☰', label: 'Danh mục bài viết' },
            { href: '/admin/blogs', icon: '▤', label: 'Bài viết' },
            { href: '/admin/categories', icon: '⊞', label: 'Danh mục' },
            { href: '/admin/templates', icon: '▣', label: 'Mẫu CV' },
            { href: '/admin/messages', icon: '☗', label: 'Tin nhắn' },
        ],
    },
];

function SideNavItem({
    item,
    collapsed,
    badge,
}: {
    item: NavItem;
    collapsed: boolean;
    badge?: number;
}) {
    const pathname = usePathname();
    const active = pathname === item.href || pathname.startsWith(item.href + '/');

    return (
        <Link
            href={item.href}
            className={`
                relative flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm transition-all mb-0.5
                ${active
                    ? 'bg-indigo-500/[0.15] text-white'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/[0.05]'
                }
                ${collapsed ? 'justify-center px-2' : ''}
            `}
        >
            {active && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 rounded-r bg-indigo-400" />
            )}

            <span className={`text-base w-5 text-center flex-shrink-0 ${active ? 'text-indigo-400' : ''}`}>
                {item.icon}
            </span>

            {!collapsed && (
                <>
                    <span className="flex-1 font-medium">{item.label}</span>
                    {badge != null && badge > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                            {badge > 9 ? '9+' : badge}
                        </span>
                    )}
                </>
            )}

            {/* Collapsed badge dot */}
            {collapsed && badge != null && badge > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            )}
        </Link>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const loadUnread = () => {
        fetch('/api/admin/admin-conversations')
            .then(r => r.json())
            .then(d => {
                const total = (d.conversations ?? []).reduce(
                    (sum: number, c: { unread?: number }) => sum + (c.unread ?? 0),
                    0
                );
                setUnreadMessages(total);
            })
            .catch(() => { });
    };

    const loadNotifications = () => {
        fetch('/api/admin/notifications')
            .then(r => r.json())
            .then(d => {
                setNotifications(d.notifications ?? []);
            })
            .catch(() => { });
    };

    useEffect(() => {
        loadUnread();
        const interval = setInterval(loadUnread, pathname.startsWith('/admin/messages') ? 3000 : 15000);
        return () => clearInterval(interval);
    }, [pathname]);

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 15000);
        return () => clearInterval(interval);
    }, []);

    const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = async (notif: any) => {
        if (!notif.isRead) {
            await fetch(`/api/admin/notifications/${notif.id}/read`, { method: 'PATCH' });
            loadNotifications();
        }
        setShowNotifications(false);
        if (notif.title.includes('Doanh nghiệp')) {
            router.push('/admin/companies');
        } else if (notif.title.includes('Tin tuyển dụng')) {
            router.push('/admin/jobs');
        }
    };

    // Reset unread khi vào trang messages
    useEffect(() => {
        if (pathname.startsWith('/admin/messages')) {
            setUnreadMessages(0);
        }
        setMobileOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
    };

    const currentItem = NAV_GROUPS.flatMap(g => g.items).find(
        i => pathname === i.href || pathname.startsWith(i.href + '/')
    );

    const sidebarWidth = collapsed ? 'w-[72px]' : 'w-60';

    return (
        <div className="flex h-screen overflow-hidden bg-[#070a14] text-white font-sans">

            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                className={`
                    ${sidebarWidth} flex-shrink-0 flex flex-col h-screen
                    bg-[#060810]/95 border-r border-white/[0.07]
                    transition-[width] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]
                    fixed lg:relative z-50
                    ${mobileOpen ? 'translate-x-0 w-60' : '-translate-x-full lg:translate-x-0'}
                    overflow-hidden
                `}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 h-[60px] border-b border-white/[0.07] flex-shrink-0 overflow-hidden whitespace-nowrap">
                    <div className="w-[34px] h-[34px] flex-shrink-0 rounded-[9px] bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center text-base shadow-[0_0_20px_rgba(99,102,241,0.35)]">
                        🛡️
                    </div>
                    {!collapsed && (
                        <span className="font-bold text-[15px] text-white tracking-tight">
                            Phú Quốc<span className="text-indigo-400">Jobs</span>
                        </span>
                    )}
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="hidden lg:flex absolute right-0 top-[46px] translate-x-1/2 w-6 h-6 rounded-full bg-[#0f1120] border border-white/[0.1] items-center justify-center text-white/40 text-xs hover:text-white hover:border-white/20 transition-all z-10"
                >
                    {collapsed ? '›' : '‹'}
                </button>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    {NAV_GROUPS.map(group => (
                        <div key={group.title} className="mb-6">
                            <div className={`text-[10px] font-semibold uppercase tracking-[1.2px] text-white/30 px-2.5 mb-1.5 whitespace-nowrap overflow-hidden transition-opacity ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
                                {group.title}
                            </div>
                            {group.items.map(item => (
                                <SideNavItem
                                    key={item.href}
                                    item={item}
                                    collapsed={collapsed}
                                    badge={item.href === '/admin/messages' ? unreadMessages : undefined}
                                />
                            ))}
                        </div>
                    ))}
                </nav>

                {/* User footer */}
                <div className="border-t border-white/[0.07] p-2.5 flex-shrink-0">
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/[0.04] transition-colors overflow-hidden whitespace-nowrap">
                        <div className="w-8 h-8 flex-shrink-0 rounded-[9px] bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center text-sm">
                            👤
                        </div>
                        {!collapsed && (
                            <>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-medium text-white/85 truncate">Admin</div>
                                    <div className="text-[11px] text-indigo-400">Quản trị viên</div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    title="Đăng xuất"
                                    className="flex-shrink-0 p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm"
                                >
                                    ⏻
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {/* MAIN */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <header className="relative z-20 h-[60px] flex items-center gap-4 px-6 border-b border-white/[0.07] bg-[#060810]/80 backdrop-blur-xl flex-shrink-0">
                    <button
                        onClick={() => setMobileOpen(o => !o)}
                        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-[9px] border border-white/[0.07] bg-white/[0.03] text-white text-base"
                    >
                        ☰
                    </button>

                    <div className="flex-1">
                        <span className="font-bold text-base text-white">
                            {currentItem?.label ?? 'Admin'}
                        </span>
                        <span className="text-white/30 text-xs font-normal ml-2">/ Phú Quốc Jobs</span>
                    </div>

                    <div className="hidden md:flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-[9px] px-3 py-2 w-52 focus-within:border-indigo-400/40 focus-within:bg-indigo-500/[0.05] transition-all">
                        <span className="text-white/30 text-sm">⌕</span>
                        <input
                            placeholder="Tìm kiếm nhanh..."
                            className="bg-transparent border-none outline-none text-white text-[13px] placeholder:text-white/25 w-full"
                        />
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(prev => !prev)}
                            className="relative w-9 h-9 flex items-center justify-center rounded-[9px] border border-white/[0.07] bg-white/[0.03] text-white/50 hover:text-white hover:border-white/15 cursor-pointer transition-all text-base"
                        >
                            🔔
                            {unreadNotificationsCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-[10px] text-white font-bold flex items-center justify-center px-1">
                                    {unreadNotificationsCount}
                                </span>
                            )}
                        </button>
                        
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-black border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden text-left">
                                <div className="px-4 py-3 border-b border-white/[0.08] flex justify-between items-center">
                                    <span className="font-semibold text-xs text-white">Thông báo ({unreadNotificationsCount})</span>
                                    {unreadNotificationsCount > 0 && (
                                        <button 
                                            onClick={async () => {
                                                const unread = notifications.filter(notif => !notif.isRead);
                                                await Promise.all(unread.map(n => 
                                                    fetch(`/api/admin/notifications/${n.id}/read`, { method: 'PATCH' })
                                                ));
                                                loadNotifications();
                                            }}
                                            className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline"
                                        >
                                            Đọc tất cả
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.04]">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-xs text-white/40">Không có thông báo nào</div>
                                    ) : (
                                        notifications.map(n => (
                                            <div 
                                                key={n.id} 
                                                onClick={() => handleNotificationClick(n)}
                                                className={`px-4 py-3 text-xs cursor-pointer hover:bg-white/[0.03] transition-colors ${!n.isRead ? 'bg-indigo-500/[0.03]' : ''}`}
                                            >
                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                    <span className={`font-semibold ${!n.isRead ? 'text-indigo-300' : 'text-white/80'}`}>{n.title}</span>
                                                    <span className="text-[10px] text-white/30 whitespace-nowrap">{new Date(n.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-white/60 leading-relaxed truncate">{n.content}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-7 bg-[radial-gradient(ellipse_50%_40%_at_80%_10%,rgba(99,102,241,0.05),transparent),radial-gradient(ellipse_40%_30%_at_10%_90%,rgba(16,185,129,0.04),transparent)]">
                    {children}
                </main>
            </div>
        </div>
    );
}