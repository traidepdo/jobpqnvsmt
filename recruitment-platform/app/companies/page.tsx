import React from 'react';
import Link from 'next/link';
import { prisma } from "@/lib/prisma";
import CompanyFilter from '@/components/companies/CompanyFilter';
import { categoryService } from '@/server/services/categoty.services';
import { companyService } from '@/server/services/company.services';
interface RouteParams {
    searchParams: Promise<{ search?: string; industry?: string; page?: string }>;
}

// ─── GENERATE METADATA FOR SEO ─────────────────────────────────────────────
export async function generateMetadata({ searchParams }: RouteParams) {
    const params = await searchParams;
    const search = params.search || '';
    const industry = params.industry || '';

    let title = 'Khám phá các công ty & nhà tuyển dụng nổi bật tại Phú Quốc';
    let description = 'Danh sách các doanh nghiệp, resort, nhà hàng hàng đầu đang tuyển dụng tại đảo ngọc Phú Quốc. Tìm kiếm thông tin liên hệ và cơ hội nghề nghiệp phù hợp ngay hôm nay!';

    if (search) {
        title = `Tìm kiếm công ty: "${search}" | Phú Quốc Jobs`;
    } else if (industry) {
        title = `Công ty tuyển dụng ngành ${industry} tại Phú Quốc | Phú Quốc Jobs`;
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
        }
    };
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default async function CompaniesPage({ searchParams }: RouteParams) {
    const params = await searchParams;
    const page = parseInt(params.page || '1');
    const limit = 9;
    const industry = params.industry || '';
    const search = params.search || '';

    const res = await companyService.getList({ page, limit, industry, search });
    const { companies, totalpage, total } = res;

    const categories = await categoryService.getAllCategories();

    const totalPages = totalpage;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phuquocjobs.vn';

    // JSON-LD Schema list for companies
    const listSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': 'Danh sách các công ty tuyển dụng tại Phú Quốc',
        'itemListElement': companies.map((company, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'url': `${baseUrl}/companies/${company.slug}`,
            'name': company.name,
        }))
    };

    const buildPageUrl = (targetPage: number) => {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (industry) queryParams.set('industry', industry);
        if (targetPage > 1) {
            queryParams.set('page', targetPage.toString());
        }
        const queryString = queryParams.toString();
        return `/companies${queryString ? `?${queryString}` : ''}`;
    };

    return (
        <main className="max-w-[1300px] w-full mx-auto px-4 py-20 min-h-screen bg-gray-50/50">
            {/* JSON-LD Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }}
            />
            {/* Hero Section - Unified header and search filter in Premium Corporate Emerald Green */}
            <section className="bg-gradient-to-r from-[#005325] via-[#00853b] to-[#00a84b] rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden shadow-md">
                {/* Decorative background grid/blobs */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 left-10 w-64 h-64 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#00b14f] bg-white px-3 py-1.5 rounded-full mb-3.5 shadow-sm">
                        <span className="material-symbols-outlined text-xs font-bold text-[#00b14f]">domain</span>
                        <span className="text-[#005325]">Khám phá doanh nghiệp</span>
                    </span>

                    <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
                        Khám phá các <span className="text-yellow-300">Công ty nổi bật</span> tại Phú Quốc
                    </h1>

                    <p className="text-green-100 text-sm max-w-2xl leading-relaxed mb-6">
                        Tìm kiếm môi trường làm việc lý tưởng từ <strong className="text-white font-bold">{total}</strong> doanh nghiệp và nhà tuyển dụng hoạt động tích cực nhất tại đảo Ngọc.
                    </p>

                    {/* Bộ lọc Client-Side component nhận dữ liệu Server ban đầu */}
                    <div className="!mb-0">
                        <CompanyFilter initialSearch={search} initialIndustry={industry} categories={categories} />
                    </div>
                </div>
            </section>

            {/* Vùng hiển thị danh sách */}
            {companies.length === 0 ? (
                <section className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">business_disabled</span>
                    <p className="font-semibold text-gray-600 mb-1 text-base">Không tìm thấy công ty nào phù hợp</p>
                    <p className="text-sm text-gray-400">Hãy thử thay đổi từ khóa hoặc bộ lọc ngành nghề xem sao nhé.</p>
                </section>
            ) : (
                <section className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {companies.map((company) => (
                            <article
                                key={company.id}
                                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col relative"
                            >
                                {/* Cover Photo Container */}
                                <div className="h-28 w-full relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-green-400/5 to-teal-500/10">
                                    {company.coverImage ? (
                                        <img
                                            src={company.coverImage}
                                            alt={`${company.name} cover`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full relative opacity-95">
                                            <div className="absolute inset-0 bg-gradient-to-br from-[#005325] via-[#00853b] to-[#00a84b]" />
                                            <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-700" />
                                            <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-white/5 rounded-full blur-xl group-hover:scale-110 transition-transform duration-700" />
                                        </div>
                                    )}
                                    {/* Floating Active Jobs Badge */}
                                    <span className="absolute top-3 right-3 text-[11px] font-bold text-white bg-[#00b14f] px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px] font-bold">work</span>
                                        {company._count?.jobs || 0} việc làm
                                    </span>
                                </div>

                                {/* Logo Overlap Container */}
                                <div className="px-5 -mt-8 relative z-10 flex items-end justify-between">
                                    <div className="w-16 h-16 rounded-xl bg-white p-1 shadow-md border border-gray-100/80 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={company.logo || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=100'}
                                            alt={company.name}
                                            className="w-full h-full object-contain rounded-lg"
                                        />
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="p-5 pt-3 flex-1 flex flex-col">
                                    {/* Name and Industry */}
                                    <div className="mb-2">
                                        <Link
                                            href={`/companies/${company.slug}`}
                                            className="font-bold text-gray-900 group-hover:text-[#00b14f] text-[16px] leading-tight block transition-colors line-clamp-1 mb-1"
                                            title={company.name}
                                        >
                                            {company.name}
                                        </Link>
                                        <span className="inline-block text-[11px] font-semibold text-[#00b14f] bg-[#00b14f]/10 px-2.5 py-0.5 rounded-md">
                                            {company.industry || 'Chưa cập nhật'}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4 flex-1">
                                        {company.description || 'Chưa có thông tin mô tả chi tiết về doanh nghiệp này.'}
                                    </p>

                                    {/* Info list */}
                                    <div className="space-y-2 pt-3 border-t border-gray-100 text-[12px] text-gray-500">
                                        {company.size && (
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-gray-400">group</span>
                                                <span>Quy mô: {company.size}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px] text-gray-400">location_on</span>
                                            <span className="truncate">
                                                {company.ward?.district?.province
                                                    ? `${company.ward.district.name}, ${company.ward.district.province.name}`
                                                    : 'Toàn quốc'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Điều khiển phân trang thuần Server-Side (Không cần Javascript) */}
                    {totalPages > 1 && (
                        <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Phân trang danh sách công ty">
                            <Link
                                href={buildPageUrl(page - 1)}
                                className={`p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-gray-600 transition-colors ${page === 1 ? 'pointer-events-none opacity-40 bg-gray-50' : ''}`}
                                aria-disabled={page === 1}
                            >
                                <span className="material-symbols-outlined text-[18px] block">chevron_left</span>
                            </Link>

                            <span className="text-sm font-medium text-gray-600 px-3">
                                Trang {page} / {totalPages}
                            </span>

                            <Link
                                href={buildPageUrl(page + 1)}
                                className={`p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-gray-600 transition-colors ${page === totalPages ? 'pointer-events-none opacity-40 bg-gray-50' : ''}`}
                                aria-disabled={page === totalPages}
                            >
                                <span className="material-symbols-outlined text-[18px] block">chevron_right</span>
                            </Link>
                        </nav>
                    )}
                </section>
            )}
        </main>
    );
}