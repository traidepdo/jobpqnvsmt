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

    let title = 'Top 10+ Công ty & Nhà tuyển dụng nổi bật nhất tại Phú Quốc';
    let description = 'Bảng xếp hạng các doanh nghiệp, resort, khách sạn, nhà hàng hàng đầu đang có nhiều tin tuyển dụng hoạt động nhất tại đảo ngọc Phú Quốc. Tìm kiếm việc làm mơ ước ngay hôm nay!';

    if (search) {
        title = `Top tìm kiếm công ty: "${search}" | Phú Quốc Jobs`;
    } else if (industry) {
        title = `Top công ty tuyển dụng ngành ${industry} tại Phú Quốc | Phú Quốc Jobs`;
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

    // 1. Lấy tất cả ID các công ty thỏa mãn bộ lọc để xếp hạng
    const matchingCompanies = await prisma.company.findMany({
        where: whereClause,
        select: { id: true }
    });
    const matchingIds = matchingCompanies.map(c => c.id);

    // 2. Gom nhóm các công việc có trạng thái ACTIVE theo companyId để sắp xếp
    const activeJobsGroup = await prisma.job.groupBy({
        by: ["companyId"],
        _count: {
            id: true
        },
        where: {
            status: "ACTIVE",
            companyId: { in: matchingIds }
        },
        orderBy: {
            _count: {
                id: "desc"
            }
        }
    });

    // Các ID công ty có việc làm đang tuyển (đã được sắp xếp giảm dần)
    const sortedActiveCompanyIds = activeJobsGroup.map(g => g.companyId);

    // Các ID công ty còn lại (có 0 việc làm đang tuyển), xếp ở dưới cùng
    const activeIdsSet = new Set(sortedActiveCompanyIds);
    const zeroActiveCompanyIds = matchingIds.filter(id => !activeIdsSet.has(id));

    // Tổ hợp toàn bộ danh sách ID đã sắp xếp theo thứ tự ưu tiên tuyển dụng
    const allSortedIds = [...sortedActiveCompanyIds, ...zeroActiveCompanyIds];

    const total = allSortedIds.length;
    const totalPages = Math.ceil(total / limit) || 1;

    // Lấy slice các ID cho trang hiện tại
    const paginatedIds = allSortedIds.slice(skip, skip + limit);

    // 3. Truy vấn thông tin chi tiết của các công ty trong trang hiện tại
    const companies = await prisma.company.findMany({
        where: {
            id: { in: paginatedIds }
        },
        include: {
            _count: {
                select: {
                    jobs: {
                        where: {
                            status: "ACTIVE"
                        }
                    }
                }
            },
            ward: {
                include: {
                    district: {
                        include: {
                            province: true
                        }
                    }
                }
            }
        }
    });

    // Sắp xếp lại danh sách kết quả trả về đúng thứ tự của paginatedIds
    const orderedCompanies = paginatedIds
        .map(id => companies.find(c => c.id === id))
        .filter(Boolean) as typeof companies;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phuquocjobs.vn';

    // JSON-LD Schema list for companies
    const listSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': 'Danh sách các công ty tuyển dụng hàng đầu tại Phú Quốc',
        'itemListElement': orderedCompanies.map((company, index) => ({
            '@type': 'ListItem',
            'position': skip + index + 1,
            'url': `${baseUrl}/companies/${company.slug}`,
            'name': company.name,
        }))
    };

    // Hàm vẽ Huy hiệu thứ hạng Top
    const renderRankBadge = (index: number) => {
        const rank = skip + index + 1;
        if (rank === 1) {
            return (
                <div className="absolute -top-3 -left-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-tl-lg rounded-br-lg shadow-md flex items-center gap-1 z-10">
                    <span className="material-symbols-outlined text-[12px] font-bold">trophy</span>
                    <span>TOP 1</span>
                </div>
            );
        }
        if (rank === 2) {
            return (
                <div className="absolute -top-3 -left-2 bg-gradient-to-r from-slate-400 to-slate-300 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-tl-lg rounded-br-lg shadow-md flex items-center gap-1 z-10">
                    <span className="material-symbols-outlined text-[12px] font-bold">workspace_premium</span>
                    <span>TOP 2</span>
                </div>
            );
        }
        if (rank === 3) {
            return (
                <div className="absolute -top-3 -left-2 bg-gradient-to-r from-amber-700 to-amber-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-tl-lg rounded-br-lg shadow-md flex items-center gap-1 z-10">
                    <span className="material-symbols-outlined text-[12px] font-bold">workspace_premium</span>
                    <span>TOP 3</span>
                </div>
            );
        }
        return (
            <div className="absolute -top-3 -left-2 bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-tl-lg rounded-br-lg shadow-sm z-10">
                #{rank}
            </div>
        );
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
                <h1 className="text-2xl font-bold text-[#041b3c] mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-3xl">local_fire_department</span>
                    Top Nhà Tuyển Dụng Nổi Bật Tại Phú Quốc
                </h1>
                <p className="text-sm text-gray-500">Danh sách doanh nghiệp được xếp hạng theo quy mô tin tuyển dụng hoạt động tích cực nhất.</p>
            </header>

            {/* Bộ lọc Client-Side với targetPath cho trang Top Companies */}
            <CompanyFilter initialSearch={search} initialIndustry={industry} targetPath="/companies/top-companies" />

            {/* Vùng hiển thị danh sách */}
            {orderedCompanies.length === 0 ? (
                <section className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">business_disabled</span>
                    <p className="font-semibold text-gray-600 mb-1 text-base">Không tìm thấy công ty nào phù hợp</p>
                    <p className="text-sm text-gray-400">Hãy thử thay đổi từ khóa hoặc bộ lọc ngành nghề xem sao nhé.</p>
                </section>
            ) : (
                <section className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {orderedCompanies.map((company, index) => (
                            <article
                                key={company.id}
                                className="bg-white rounded-xl border border-gray-100 p-5 flex gap-4 shadow-sm hover:shadow-md hover:border-[#00b14f]/30 transition-all group relative"
                            >
                                {/* Huy hiệu thứ hạng */}
                                {renderRankBadge(index)}

                                <img
                                    src={company.logo || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=100'}
                                    alt={company.name}
                                    className="w-16 h-16 rounded-xl object-contain border bg-gray-50 flex-shrink-0 mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                    <Link
                                        href={`/companies/${company.slug}`}
                                        className="font-bold text-[#041b3c] group-hover:text-[#00b14f] text-base block mb-1 transition-colors truncate"
                                    >
                                        {company.name}
                                    </Link>

                                    {/* Số việc làm đang tuyển và thông tin chung */}
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                                        <span className="text-[#00b14f] bg-[#00b14f]/10 text-xs font-semibold px-2 py-0.5 rounded">
                                            {company.industry || 'Chưa cập nhật'}
                                        </span>
                                        {company.size && (
                                            <span className="text-xs text-gray-400 font-medium">
                                                • Quy mô: {company.size}
                                            </span>
                                        )}
                                        <span className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded flex items-center gap-0.5 ml-auto">
                                            <span className="material-symbols-outlined text-[13px]">work</span>
                                            {company._count?.jobs ?? 0} đang tuyển
                                        </span>
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
                                href={`/companies/top-companies?search=${encodeURIComponent(search)}&industry=${encodeURIComponent(industry)}&page=${page - 1}`}
                                className={`p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-gray-600 transition-colors ${page === 1 ? 'pointer-events-none opacity-40 bg-gray-50' : ''}`}
                                aria-disabled={page === 1}
                            >
                                <span className="material-symbols-outlined text-[18px] block">chevron_left</span>
                            </Link>

                            <span className="text-sm font-medium text-gray-600 px-3">
                                Trang {page} / {totalPages}
                            </span>

                            <Link
                                href={`/companies/top-companies?search=${encodeURIComponent(search)}&industry=${encodeURIComponent(industry)}&page=${page + 1}`}
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