'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserMenuProps {
    user: {
        id: string;
        name: string;
        email?: string;
        role: string;
        avatar?: string | null;
    };
}

export default function UserMenu({ user }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Lấy chữ cái đầu của tên để làm avatar mặc định
    const getInitials = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : 'U';
    };

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/auth/logout', {
                method: 'POST',
            });
            if (res.ok) {
                router.refresh();
                router.push('/login');
            }
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
        }
    };

    // Cấu hình màu sắc badge và avatar gradient theo từng vai trò
    const roleConfig = () => {
        switch (user.role) {
            case 'ADMIN':
                return {
                    label: 'Quản trị viên',
                    badgeBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                    avatarBg: 'bg-gradient-to-tr from-rose-500 to-orange-500',
                    dashboardUrl: '/admin/dashboard',
                };
            case 'EMPLOYER':
                return {
                    label: 'Nhà tuyển dụng',
                    badgeBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                    avatarBg: 'bg-gradient-to-tr from-emerald-500 to-teal-500',
                    dashboardUrl: '/employer/dashboard',
                };
            case 'CANDIDATE':
            default:
                return {
                    label: 'Ứng viên',
                    badgeBg: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
                    avatarBg: 'bg-gradient-to-tr from-sky-500 to-indigo-500',
                    dashboardUrl: '/candidate/dashboard',
                };
        }
    };

    const config = roleConfig();

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Nút Avatar */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 p-1 rounded-full hover:bg-gray-100/80 transition-all focus:outline-none cursor-pointer duration-200"
            >
                {user.avatar ? (
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-gray-100"
                    />
                ) : (
                    <div className={`w-9 h-9 rounded-full ${config.avatarBg} text-white flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm ring-2 ring-gray-100/50`}>
                        {getInitials(user.name)}
                    </div>
                )}
                <span className="hidden sm:inline text-sm font-semibold text-gray-700 pr-1 hover:text-gray-900">
                    {user.name}
                </span>
            </button>

            {/* Menu thả xuống */}
            <div className={`absolute right-0 mt-2.5 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2.5 z-50 transition-all duration-200 origin-top-right
                ${isOpen ? "opacity-100 scale-100 pointer-events-auto translate-y-0" : "opacity-0 scale-95 pointer-events-none -translate-y-2"}`}
            >
                {/* Header thông tin người dùng */}
                <Link
                    href={config.dashboardUrl}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-3 flex flex-col gap-1.5 hover:bg-gray-50/80 transition-colors cursor-pointer group"
                >
                    <div className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors flex items-center justify-between">
                        <span>{user.name}</span>
                        <span className="text-gray-400 group-hover:translate-x-0.5 transition-transform text-[11px] font-bold">→</span>
                    </div>
                    {user.email && (
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    )}
                    <span className={`inline-flex items-center justify-center self-start px-2 py-0.5 mt-1 text-[10px] font-bold border rounded-full ${config.badgeBg}`}>
                        {config.label}
                    </span>
                </Link>

                {/* Đường kẻ ngang phân cách */}
                <div className="h-px bg-gray-100 my-1" />

                {/* Danh sách chức năng */}
                <div className="px-1.5 py-1.5 flex flex-col gap-0.5">
                    {user.role === 'CANDIDATE' ? (
                        <>
                            <Link
                                href="/candidate/user"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-500">
                                    person
                                </span>
                                Thông tin cá nhân
                            </Link>
                            <Link
                                href="/candidate/dashboard"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-500">
                                    assignment
                                </span>
                                Dashboard
                            </Link>
                            <Link
                                href="/candidate/resumes"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-500">
                                    description
                                </span>
                                CV đã tạo
                            </Link>
                            <Link
                                href="/candidate/applications"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-500">
                                    mail
                                </span>
                                Việc làm đã ứng tuyển
                            </Link>
                            <Link
                                href="/candidate/saved"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-500">
                                    bookmark
                                </span>
                                Việc đã lưu
                            </Link>
                            <Link
                                href="/candidate/follow-employer"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-500">
                                    people
                                </span>
                                Công ty theo dõi
                            </Link>
                            <Link
                                href="/job-flash?my_jobs=true"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px] text-amber-600">
                                    bolt
                                </span>
                                Quản lý tin Flash của tôi
                            </Link>
                        </>
                    ) : user.role === 'EMPLOYER' ? (
                        <>
                            <Link
                                href={config.dashboardUrl}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-500">
                                    dashboard
                                </span>
                                Dashboard
                            </Link>
                            <Link
                                href="/job-flash?my_jobs=true"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px] text-amber-600">
                                    bolt
                                </span>
                                Quản lý tin Flash của tôi
                            </Link>
                            <Link
                                href={"/employer/company"}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-500">
                                    info
                                </span>
                                Quản lý thông tin công ty
                            </Link>
                            <Link
                                href={"/employer/jobs"}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-500">
                                    description
                                </span>
                                Quản lý tin tuyển dụng
                            </Link>
                            <Link
                                href={"/employer/quizzes"}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-500">
                                    quiz
                                </span>
                                Quản lý bài test
                            </Link>
                            <Link
                                href={"/employer/applications"}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-500">
                                    manage_history
                                </span>
                                Quản lý đơn ứng tuyển
                            </Link>
                            <Link
                                href={"/employer/interviews"}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-500">
                                    history_edu
                                </span>
                                Lịch phỏng vấn
                            </Link>
                        </>
                    ) : (
                        <Link
                            href={config.dashboardUrl}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                        >
                            <span className="material-symbols-outlined text-[20px] text-gray-500">
                                business
                            </span>
                            Quản lý hồ sơ
                        </Link>

                    )}
                </div>

                {/* Đường kẻ ngang phân cách */}
                <div className="h-px bg-gray-100 my-1" />

                {/* Nút đăng xuất */}
                <div className="px-1.5 pt-1">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-medium text-left cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[20px] text-rose-600">
                            logout
                        </span>
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    );
}
