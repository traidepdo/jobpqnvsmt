import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatSalary } from '@/lib/jobLabels';
import FollowButton from '@/components/companies/FollowButton';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// ─── GENERATE METADATA FOR SEO ─────────────────────────────────────────────
export async function generateMetadata({ params }: RouteParams) {
    const { id } = await params;
    const company = await prisma.company.findUnique({
        where: { id, isApproved: true, isActive: true },
        select: { name: true, description: true, industry: true, addressDetail: true }
    });

    if (!company) {
        return {
            title: 'Không tìm thấy công ty | Phú Quốc Jobs',
            description: 'Công ty không tồn tại hoặc đã ngừng hoạt động trên hệ thống.'
        };
    }

    const title = `${company.name} - Tuyển dụng & Giới thiệu | Phú Quốc Jobs`;
    const description = `Thông tin tuyển dụng mới nhất từ ${company.name} tại Phú Quốc. Ngành nghề: ${company.industry || 'Chưa cập nhật'}. Địa chỉ: ${company.addressDetail || ''}. Tìm kiếm việc làm phù hợp và nộp đơn ngay!`;

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
export default async function CompanyDetailPage({ params }: RouteParams) {
    const { id: companyId } = await params;

    // Fetch company detail directly from Database
    const company = await prisma.company.findUnique({
        where: { id: companyId, isApproved: true, isActive: true },
        include: {
            ward: {
                include: {
                    district: {
                        include: {
                            province: true
                        }
                    }
                }
            },
            jobs: {
                where: { status: "ACTIVE" },
                orderBy: { createdAt: "desc" },
                include: {
                    category: {
                        select: { name: true }
                    }
                }
            }
        }
    });

    if (!company) {
        notFound();
    }

    // Check auth state & follow status on server
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    let initialFollowed = false;
    let isLoggedIn = false;

    if (token) {
        try {
            const payload = await verifyToken(token);
            if (payload) {
                isLoggedIn = true;
                const existing = await prisma.savedCompany.findUnique({
                    where: { userId_companyId: { userId: payload.id as string, companyId } }
                });
                initialFollowed = !!existing;
            }
        } catch (err) {
            console.error("Error verifying token in Server Component:", err);
        }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phuquocjobs.vn';

    // JSON-LD Schemas for SEO
    const companySchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': company.name,
        'url': `${baseUrl}/companies/${company.id}`,
        'logo': company.logo || undefined,
        'sameAs': company.website || undefined,
        'description': company.description || undefined,
        'address': {
            '@type': 'PostalAddress',
            'streetAddress': company.addressDetail || undefined,
            'addressLocality': company.ward?.name || undefined,
            'addressRegion': company.ward?.district?.province?.name || undefined,
            'addressCountry': 'VN'
        }
    };

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Trang chủ',
                'item': baseUrl,
            },
            {
                '@type': 'ListItem',
                'position': 2,
                'name': 'Nhà tuyển dụng',
                'item': `${baseUrl}/companies`,
            },
            {
                '@type': 'ListItem',
                'position': 3,
                'name': company.name,
                'item': `${baseUrl}/companies/${company.id}`,
            }
        ]
    };

    const companyJobsSchema = company.jobs?.length > 0 ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': `Việc làm đang tuyển dụng tại ${company.name}`,
        'itemListElement': company.jobs.map((job, index) => ({
            '@type': 'ListItem',
            'position': index + 1,
            'url': `${baseUrl}/jobs/${job.slug}`,
            'name': job.title,
        }))
    } : null;

    return (
        <main className="bg-gray-100/60 min-h-screen pb-12">
            {/* JSON-LD for Search Engines */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(companySchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            {companyJobsSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(companyJobsSchema) }}
                />
            )}

            {/* BANNER HEADER */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-6xl mx-auto relative">
                    <div className="h-48 md:h-64 bg-gradient-to-r from-[#041b3c] to-[#0a3366] relative rounded-b-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-black/10" />
                    </div>

                    <div className="px-6 pb-6 pt-2 flex flex-col md:flex-row gap-5 items-start md:items-end -mt-16 relative z-10">
                        <div className="w-32 h-32 bg-white rounded-2xl p-2 shadow-md border border-gray-100 flex-shrink-0">
                            <img
                                src={company.logo || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150'}
                                alt={company.name}
                                className="w-full h-full object-contain rounded-xl"
                            />
                        </div>

                        <div className="flex-1 min-w-0 md:mb-2">
                            <h1 id="company-title" className="text-xl md:text-2xl font-bold text-white md:text-[#041b3c] drop-shadow md:drop-shadow-none mb-2">
                                {company.name}
                            </h1>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                                {company.website && (
                                    <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#00b14f]">
                                        <span className="material-symbols-outlined text-[18px]">language</span> {company.website}
                                    </a>
                                )}
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[18px]">group</span> Quy mô: {company.size || 'Chưa cập nhật'}
                                </span>
                            </div>
                        </div>

                        {/* NÚT THEO DÕI (CLIENT SIDE INTERACTIVE) */}
                        <div className="flex-shrink-0 w-full md:w-auto md:mb-2">
                            <FollowButton
                                companyId={company.id}
                                initialFollowed={initialFollowed}
                                isLoggedIn={isLoggedIn}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* CHI TIẾT NỘI DUNG CHIA 2 CỘT */}
            <div className="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* CỘT TRÁI: GIỚI THIỆU & VIỆC LÀM ĐANG TUYỂN */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm" aria-labelledby="company-intro-heading">
                        <h2 id="company-intro-heading" className="text-lg font-bold text-[#041b3c] border-l-4 border-[#00b14f] pl-3 mb-4">
                            Giới thiệu công ty
                        </h2>
                        <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                            {company.description || "Chưa có bài viết mô tả chi tiết cho công ty này."}
                        </p>
                    </section>

                    <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm" aria-labelledby="company-jobs-heading">
                        <h2 id="company-jobs-heading" className="text-lg font-bold text-[#041b3c] border-l-4 border-[#00b14f] pl-3 mb-4">
                            Tuyển dụng ({company.jobs?.length || 0})
                        </h2>

                        {!company.jobs || company.jobs.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-sm">
                                Hiện tại doanh nghiệp chưa đăng tin tuyển dụng mới nào.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {company.jobs.map((job) => (
                                    <article key={job.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50/50 hover:border-[#00b14f]/50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div className="min-w-0">
                                            <Link href={`/jobs/${job.slug}`} className="font-semibold text-gray-800 hover:text-[#00b14f] text-sm block truncate mb-1">
                                                {job.title}
                                            </Link>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                                <span className="font-bold text-[#00b14f]">
                                                    {formatSalary(job.salaryMin, job.salaryMax)}
                                                </span>
                                                <span>• {job.category?.name}</span>
                                                {job.experience && <span>• Knghiệm: {job.experience}</span>}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-400 flex-shrink-0 self-end sm:self-center">
                                            Hạn nộp: {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* CỘT PHẢI: THÔNG TIN BỔ TRỢ */}
                <aside className="space-y-6">
                    <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm" aria-labelledby="company-contact-heading">
                        <h2 id="company-contact-heading" className="text-base font-bold text-[#041b3c] border-b pb-3 mb-4">
                            Thông tin liên hệ
                        </h2>

                        <div className="space-y-4 text-sm">
                            <div className="flex gap-3 items-start">
                                <span className="material-symbols-outlined text-gray-400 text-[20px] mt-0.5">location_on</span>
                                <div>
                                    <p className="font-medium text-gray-700 mb-0.5">Địa chỉ công ty</p>
                                    <address className="text-gray-500 text-xs leading-relaxed not-italic">
                                        {company.addressDetail ? `${company.addressDetail}, ` : ''}
                                        {company.ward?.district?.province
                                            ? `${company.ward.name}, ${company.ward.district.name}, ${company.ward.district.province.name}`
                                            : 'Toàn quốc'
                                        }
                                    </address>
                                </div>
                            </div>

                            <div className="flex gap-3 items-start">
                                <span className="material-symbols-outlined text-gray-400 text-[20px] mt-0.5">business_center</span>
                                <div>
                                    <p className="font-medium text-gray-700 mb-0.5">Lĩnh vực hoạt động</p>
                                    <p className="text-gray-500 text-xs">{company.industry || 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    );
}