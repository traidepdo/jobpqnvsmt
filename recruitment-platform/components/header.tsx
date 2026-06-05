"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/candidate/NotificationBell";
import UserMenu from "./UserMenu";

type User = {
    id: string;
    name: string;
    email?: string;
    role: string;
    avatar?: string | null;
};

// ── Dropdown data ──────────────────────────────────────────
const JOB_DROPDOWN = [
    { icon: "search", label: "Tìm việc làm", desc: "Khám phá hàng nghìn cơ hội", href: "/jobs" },
    { icon: "bookmark", label: "Việc đã lưu", desc: "Danh sách việc yêu thích", href: "/candidate/saved-jobs" },
    { icon: "location_on", label: "Việc làm tại Phú Quốc", desc: "Cơ hội ngay tại địa phương", href: "/jobs?location=phu-quoc" },
    { icon: "trending_up", label: "Việc làm nổi bật", desc: "Hot jobs tuần này", href: "/jobs?featured=true" },
];

const CV_DROPDOWN = [
    { icon: "add_circle", label: "Tạo CV mới", desc: "Bắt đầu từ mẫu chuyên nghiệp", href: "/tao-cv" },
    { icon: "folder_open", label: "CV của tôi", desc: "Quản lý hồ sơ đã tạo", href: "/candidate/cvs" },
];

const BLOG_DROPDOWN = [
    {
        icon: "work",
        label: "Việc làm theo ngành nghề",
        desc: "Khám phá cơ hội việc làm theo từng lĩnh vực",
        href: "/blog-category/viec-lam-theo-nganh-nghe",
    },
    {
        icon: "tips_and_updates",
        label: "Cẩm nang tìm việc",
        desc: "Kinh nghiệm viết CV, phỏng vấn và tìm việc hiệu quả",
        href: "/blog-category/cam-nang-tim-viec",
    },
    {
        icon: "school",
        label: "Góc nghề nghiệp",
        desc: "Định hướng nghề nghiệp và phát triển bản thân",
        href: "/blog-category/goc-nghe-nghiep",
    },
    {
        icon: "business",
        label: "Doanh nghiệp tại Phú Quốc",
        desc: "Thông tin và đánh giá các doanh nghiệp tuyển dụng",
        href: "/blog-category/doanh-nghiep-phu-quoc",
    },
    {
        icon: "trending_up",
        label: "Tin tức thị trường lao động",
        desc: "Cập nhật xu hướng tuyển dụng và việc làm mới nhất",
        href: "/blog-category/tin-tuc-thi-truong-lao-dong",
    },
];

// ── Dropdown Component ──────────────────────────────────────
function NavDropdown({ items, isOpen }: {
    items: { icon: string; label: string; desc: string; href: string }[];
    isOpen: boolean;
}) {
    return (
        <div className={`absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-72 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden transition-all duration-200 origin-top z-50
            ${isOpen ? "opacity-100 scale-100 pointer-events-auto translate-y-0" : "opacity-0 scale-95 pointer-events-none -translate-y-2"}`}
        >
            {/* Arrow */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45" />
            <div className="p-2">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#00b14f]/5 group transition-colors"
                    >
                        <div className="w-9 h-9 rounded-xl bg-[#00b14f]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#00b14f]/20 transition-colors">
                            <span className="material-symbols-outlined text-[18px] text-[#00b14f]">{item.icon}</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[#041b3c] group-hover:text-[#00b14f] transition-colors leading-tight">{item.label}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// ── NavItem with dropdown ───────────────────────────────────
function NavItem({ label, href, dropdown }: {
    label: string;
    href: string;
    dropdown?: { icon: string; label: string; desc: string; href: string }[];
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLLIElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(href + "/");

    const openMenu = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setOpen(true);
    };

    const closeMenu = () => {
        timerRef.current = setTimeout(() => setOpen(false), 150); // delay 150ms
    };

    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    if (!dropdown) {
        return (
            <li>
                <Link
                    href={href}
                    className={`flex items-center gap-1 text-sm font-semibold py-5 border-b-2 transition-all duration-200
                        ${isActive ? "text-[#00b14f] border-[#00b14f]" : "text-[#434654] border-transparent hover:text-[#00b14f] hover:border-[#00b14f]"}`}
                >
                    {label}
                </Link>
            </li>
        );
    }

    return (
        <li ref={ref} className="relative">
            <button
                onMouseEnter={openMenu}
                onMouseLeave={closeMenu}
                onClick={() => setOpen(p => !p)}
                className={`flex items-center gap-0.5 text-sm font-semibold py-5 border-b-2 transition-all duration-200 cursor-pointer
                    ${open || isActive ? "text-[#00b14f] border-[#00b14f]" : "text-[#434654] border-transparent hover:text-[#00b14f] hover:border-[#00b14f]"}`}
            >
                {label}
                <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
                    keyboard_arrow_down
                </span>
            </button>

            {/* Dropdown — dùng chung openMenu/closeMenu */}
            <div
                onMouseEnter={openMenu}
                onMouseLeave={closeMenu}
            >
                <NavDropdown items={dropdown} isOpen={open} />
            </div>
        </li>
    );
}

// ── Main Header ─────────────────────────────────────────────
export default function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        fetch("/api/auth/me")
            .then(r => r.json())
            .then(data => { setUser(data.user); setLoading(false); });
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header className={`fixed top-0 left-0 w-full z-50 bg-white transition-all duration-300
            ${scrolled ? "shadow-[0_2px_20px_rgba(0,0,0,0.08)] border-b border-gray-100" : "border-b border-gray-100"}`}
        >
            <div className="max-w-[1300px] mx-auto px-4 md:px-8 h-16 flex justify-between items-center">

                {/* ── Logo ── */}
                <div className="flex items-center gap-10">
                    <Link href="/" className="flex items-center gap-1.5 group flex-shrink-0">
                        <span className="font-extrabold text-2xl tracking-tight text-[#041b3c] group-hover:opacity-90 transition-opacity">
                            Phú Quốc<span className="text-[#00b14f]">Jobs</span>
                        </span>
                        <span className="w-2 h-2 rounded-full bg-[#00b14f] animate-pulse" />
                    </Link>

                    {/* ── Nav ── */}
                    <nav className="hidden lg:flex items-center h-16">
                        <ul className="flex gap-3 list-none m-0 p-0 h-full items-center">
                            <NavItem label="Trang chủ" href="/" />
                            <NavItem label="Việc làm" href="/jobs" dropdown={JOB_DROPDOWN} />
                            <NavItem label="Tạo CV" href="/tao-cv" dropdown={CV_DROPDOWN} />
                            <NavItem label="Blog" href="/blog" dropdown={BLOG_DROPDOWN} />
                        </ul>
                    </nav>
                </div>

                {/* ── Right ── */}
                <div className="flex items-center gap-3">
                    <NotificationBell />

                    {loading ? (
                        /* Skeleton */
                        <div className="flex items-center gap-2">
                            <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse hidden sm:block" />
                            <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
                        </div>
                    ) : user ? (
                        <div className="flex items-center gap-3">
                            {user.role === "EMPLOYER" && (
                                <Link
                                    href="/employer/jobs/new"
                                    target="_blank"
                                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#212f3f] hover:bg-[#18222e] rounded-lg shadow-sm transition-all"
                                >
                                    <span className="material-symbols-outlined text-[14px]">add_circle</span>
                                    Đăng tuyển dụng
                                </Link>
                            )}
                            {user.role === "ADMIN" && (
                                <Link
                                    href="/admin"
                                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg shadow-sm transition-all"
                                >
                                    <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                                    Quản trị
                                </Link>
                            )}
                            <UserMenu user={user} />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="px-4 py-2 text-sm font-semibold text-[#434654] hover:text-[#00b14f] hover:bg-gray-50 rounded-lg transition-all"
                            >
                                Đăng nhập
                            </Link>
                            <Link
                                href="/register"
                                className="px-4 py-2 text-sm font-semibold text-[#00b14f] border border-[#00b14f] hover:bg-[#00b14f]/5 rounded-lg transition-all"
                            >
                                Đăng ký
                            </Link>
                            <Link
                                href="/register/employer"
                                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-[#212f3f] hover:bg-[#18222e] rounded-lg shadow-sm transition-all"
                            >
                                <span className="material-symbols-outlined text-[15px]">business_center</span>
                                Đăng tuyển dụng
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}