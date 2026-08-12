import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const sections = [
        {
            title: 'Việc làm',
            links: [
                { label: 'Tìm việc làm', href: '/jobs' },
                { label: 'Việc làm theo ngành', href: '/jobs?filter=category' },
                { label: 'Việc làm IT', href: '/jobs?category=it' },
                { label: 'Việc làm Marketing', href: '/jobs?category=marketing' },
                { label: 'Việc làm Remote', href: '/jobs?type=REMOTE' },
                { label: 'Việc làm Part-time', href: '/jobs?type=PART_TIME' },
            ],
        },
        {
            title: 'Công ty',
            links: [
                { label: 'Danh sách công ty', href: '/companies' },
                { label: 'Công ty nổi bật', href: '/companies?filter=featured' },
                { label: 'Đăng tin tuyển dụng', href: '/employer/jobs/new' },
                { label: 'Quản lý ứng tuyển', href: '/employer/applications' },
                { label: 'Hồ sơ công ty', href: '/employer/company' },
            ],
        },
        {
            title: 'Ứng viên',
            links: [
                { label: 'Tạo hồ sơ CV', href: '/candidate/resumes' },
                { label: 'Việc làm đã lưu', href: '/candidate/saved-jobs' },
                { label: 'Đơn ứng tuyển', href: '/candidate/applications' },
                { label: 'Công ty theo dõi', href: '/candidate/followed-companies' },
                { label: 'Tin nhắn', href: '/candidate/messages' },
            ],
        },
        {
            title: 'Tài nguyên',
            links: [
                { label: 'Blog & Tin tức', href: '/blogs' },
                { label: 'Hướng dẫn viết CV', href: '/blogs' },
                { label: 'Kỹ năng phỏng vấn', href: '/blogs' },
                { label: 'Thị trường lao động', href: '/blogs' },
                { label: 'Liên hệ', href: '/#contact' },
            ],
        },
    ];

    const socials = [
        {
            label: 'Facebook',
            href: 'https://facebook.com',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            ),
        },
        {
            label: 'LinkedIn',
            href: 'https://linkedin.com',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
            ),
        },
        {
            label: 'Twitter / X',
            href: 'https://x.com',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            ),
        },
        {
            label: 'YouTube',
            href: 'https://youtube.com',
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
            ),
        },
    ];

    return (
        <footer className="bg-[#041b3c] text-white">
            {/* Top banner */}
            <div className="bg-[#00b14f] py-4.5 overflow-hidden border-y border-white/10 relative flex items-center">
                {/* CSS for infinite marquee */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes marquee {
                        0% { transform: translateX(0%); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee {
                        display: flex;
                        width: max-content;
                        animation: marquee 30s linear infinite;
                    }
                    .animate-marquee:hover {
                        animation-play-state: paused;
                    }
                `}} />

                <div className="animate-marquee whitespace-nowrap flex gap-12 text-[13px] md:text-sm font-extrabold text-white/90 uppercase tracking-widest">
                    {/* First copy */}
                    <div className="flex gap-12 shrink-0 items-center">
                        <span>✦ Phú Quốc Jobs</span>
                        <span>✦ Kết nối nhà tuyển dụng hàng đầu</span>
                        <span>✦ Tìm việc làm nhanh chóng</span>
                        <span>✦ Hàng nghìn cơ hội việc làm chất lượng</span>
                        <span>✦ Phân tích lương thông minh bằng AI</span>
                        <span>✦ Tạo hồ sơ CV chuyên nghiệp</span>
                    </div>
                    {/* Second copy for seamless loop */}
                    <div className="flex gap-12 shrink-0 items-center">
                        <span>✦ Phú Quốc Jobs</span>
                        <span>✦ Kết nối nhà tuyển dụng hàng đầu</span>
                        <span>✦ Tìm việc làm nhanh chóng</span>
                        <span>✦ Hàng nghìn cơ hội việc làm chất lượng</span>
                        <span>✦ Phân tích lương thông minh bằng AI</span>
                        <span>✦ Tạo hồ sơ CV chuyên nghiệp</span>
                    </div>
                </div>
            </div>

            {/* Main footer */}
            <div className="max-w-7xl mx-auto px-6 py-14">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
                    {/* Brand column */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-[#00b14f] flex items-center justify-center">
                                <span className="text-white font-black text-sm">J</span>
                            </div>
                            <span className="font-black text-xl tracking-tight text-white">JobHub</span>
                        </Link>
                        <p className="text-sm text-green-200/70 leading-relaxed mb-6 max-w-xs">
                            Nền tảng kết nối ứng viên tài năng với nhà tuyển dụng hàng đầu Việt Nam. Hàng nghìn cơ hội việc làm chất lượng mỗi ngày.
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {[
                                { num: '10K+', label: 'Việc làm' },
                                { num: '5K+', label: 'Công ty' },
                                { num: '50K+', label: 'Ứng viên' },
                            ].map(s => (
                                <div key={s.label} className="text-center bg-white/5 rounded-xl py-3">
                                    <p className="font-black text-white text-base">{s.num}</p>
                                    <p className="text-[10px] text-green-200/60 mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Socials */}
                        <div className="flex gap-2">
                            {socials.map(s => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={s.label}
                                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#00b14f] flex items-center justify-center text-green-200 hover:text-white transition-all"
                                >
                                    {s.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {sections.map(section => (
                        <div key={section.title}>
                            <h4 className="font-bold text-white text-sm mb-4 uppercase tracking-wider">
                                {section.title}
                            </h4>
                            <ul className="space-y-2.5">
                                {section.links.map(link => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-green-200/60 hover:text-white transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Bottom bar */}
            <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-green-200/40">
                <p>© {currentYear} JobHub. Tất cả quyền được bảo lưu.</p>
                <div className="flex items-center gap-5">
                    <Link href="/#privacy" className="hover:text-white transition-colors">Chính sách bảo mật</Link>
                    <Link href="/#terms" className="hover:text-white transition-colors">Điều khoản sử dụng</Link>
                    <Link href="/" className="hover:text-white transition-colors">Sitemap</Link>
                </div>
            </div>
        </footer>
    );
}