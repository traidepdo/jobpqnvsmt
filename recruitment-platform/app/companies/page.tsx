import React from 'react';
import Link from 'next/link';
import { prisma } from "@/lib/prisma";
import CompanyFilter from '@/components/companies/CompanyFilter';

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
    const search = params.search || '';
    const industry = params.industry || '';
    const page = parseInt(params.page || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
        isApproved: true,
        isActive: true,
    };

    if (industry) {
        whereClause.industry = {
            contains: industry,
            mode: 'insensitive',
        };
    }

    if (search) {
        whereClause.name = {
            contains: search,
            mode: 'insensitive',
        };
    }

    // Chạy song song truy vấn dữ liệu & tổng số bản ghi trực tiếp trên Server
    const [companies, total] = await prisma.$transaction([
        prisma.company.findMany({
            where: whereClause,
            include: {
                ward: {
                    include: {
                        district: {
                            include: {
                                province: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limit,
        }),
        prisma.company.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phuquocjobs.vn';
    
    // JSON-LD Schema list for companies
    const listSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': 'Danh sách các công ty tuyển dụng tại Phú Quốc',
        'itemListElement': companies.map((company, index) => ({
            '@type': 'ListItem',
            'position': skip + index + 1,
            'url': `${baseUrl}/companies/${company.id}`,
            'name': company.name,
        }))
    };

    return (
        <main className="max-w-6xl mx-auto px-4 py-8 min-h-screen bg-gray-50/50">
            {/* JSON-LD Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }}
            />

            {/* Tiêu đề & Cấu trúc Heading chuẩn SEO */}
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-[#041b3c] mb-2">Khám phá các Công ty nổi bật tại Phú Quốc</h1>
                <p className="text-sm text-gray-500">Tìm kiếm môi trường làm việc lý tưởng và theo dõi để nhận tin tuyển dụng mới nhất.</p>
            </header>

            {/* Bộ lọc Client-Side component nhận dữ liệu Server ban đầu */}
            <CompanyFilter initialSearch={search} initialIndustry={industry} />

            {/* Vùng hiển thị danh sách */}
            {companies.length === 0 ? (
                <section className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">business_disabled</span>
                    <p className="font-semibold text-gray-600 mb-1 text-base">Không tìm thấy công ty nào phù hợp</p>
                    <p className="text-sm text-gray-400">Hãy thử thay đổi từ khóa hoặc bộ lọc ngành nghề xem sao nhé.</p>
                </section>
            ) : (
                <section className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {companies.map((company) => (
                            <article
                                key={company.id}
                                className="bg-white rounded-xl border border-gray-100 p-5 flex gap-4 shadow-sm hover:shadow-md transition-all group relative"
                            >
                                <img
                                    src={company.logo || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=100'}
                                    alt={company.name}
                                    className="w-16 h-16 rounded-xl object-contain border bg-gray-50 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <Link
                                        href={`/companies/${company.id}`}
                                        className="font-bold text-[#041b3c] group-hover:text-[#00b14f] text-base block mb-1 transition-colors truncate"
                                    >
                                        {company.name}
                                    </Link>

                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 font-medium mb-2">
                                        <span className="text-[#00b14f] bg-[#00b14f]/10 px-2 py-0.5 rounded">
                                            {company.industry || 'Chưa cập nhật'}
                                        </span>
                                        {company.size && <span>• Quy mô: {company.size}</span>}
                                    </div>

                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                                        {company.description || 'Chưa có thông tin mô tả chi tiết về doanh nghiệp này.'}
                                    </p>

                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                        <span className="material-symbols-outlined text-[15px] flex-shrink-0">location_on</span>
                                        <span className="truncate">
                                            {company.ward?.district?.province
                                                ? `${company.ward.district.name}, ${company.ward.district.province.name}`
                                                : 'Toàn quốc'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Điều khiển phân trang thuần Server-Side (Không cần Javascript) */}
                    {totalPages > 1 && (
                        <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Phân trang danh sách công ty">
                            <Link
                                href={`/companies?search=${encodeURIComponent(search)}&industry=${encodeURIComponent(industry)}&page=${page - 1}`}
                                className={`p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-gray-600 transition-colors ${page === 1 ? 'pointer-events-none opacity-40 bg-gray-50' : ''}`}
                                aria-disabled={page === 1}
                            >
                                <span className="material-symbols-outlined text-[18px] block">chevron_left</span>
                            </Link>

                            <span className="text-sm font-medium text-gray-600 px-3">
                                Trang {page} / {totalPages}
                            </span>

                            <Link
                                href={`/companies?search=${encodeURIComponent(search)}&industry=${encodeURIComponent(industry)}&page=${page + 1}`}
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