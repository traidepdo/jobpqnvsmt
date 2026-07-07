import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatSalary } from '@/lib/jobLabels';
import FollowButton from '@/components/companies/FollowButton';
import ShareButton from '@/components/companies/ShareButton';
import CompanyJobsList from '@/components/companies/CompanyJobsList';
import CompanyTabs from '@/components/companies/CompanyTabs';
import CompanyImages from '@/components/companies/CompanyImages';

interface RouteParams {
    params: Promise<{ slug: string }>;
}

// ─── GENERATE METADATA FOR SEO ─────────────────────────────────────────────
export async function generateMetadata({ params }: RouteParams) {
    const { slug } = await params;
    const company = await prisma.company.findUnique({
        where: { slug: slug, isApproved: true, isActive: true },
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
    const { slug } = await params;

    // Fetch company detail directly from Database
    const company = await prisma.company.findUnique({
        where: { slug: slug, isApproved: true, isActive: true },
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
                    where: { userId_companyId: { userId: payload.id as string, companyId: company.id } }
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
        'url': `${baseUrl}/companies/${company.slug}`,
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
                'item': `${baseUrl}/companies/${company.slug}`,
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

    const hasImages = !!(company.images && Array.isArray(company.images) && (company.images as string[]).length > 0);
    const hasJobs = !!(company.jobs && company.jobs.length > 0);

    return (
        <main className="bg-slate-50/50 min-h-screen py-8 px-4">
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

            {/* PANEL THỐNG NHẤT TOÀN BỘ TRANG */}
            <div className="max-w-[1300px] w-full mx-auto bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mt-15">

                {/* 1. BANNER / COVER IMAGE */}
                <div
                    className="h-48 md:h-72 bg-gradient-to-r from-[#041b3c] to-[#0a3366] relative"
                    style={company.coverImage ? {
                        backgroundImage: `url(${company.coverImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    } : undefined}
                >
                    {/* Gradient Overlay bottom to ensure text and logo contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>

                {/* 2. LOGO, CÁC THÔNG TIN CHÍNH VÀ NÚT TƯƠNG TÁC */}
                <div className="px-8 pt-2 pb-6 relative z-10">
                    <div className="flex flex-col md:flex-row gap-5 items-start md:items-end -mt-16 md:-mt-20 pb-8 border-b border-slate-100">
                        <div className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-3xl p-2 shadow-lg border border-slate-100 flex-shrink-0 flex items-center justify-center">
                            <img
                                src={company.logo || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150'}
                                alt={company.name}
                                className="w-full h-full object-contain rounded-2xl"
                            />
                        </div>

                        <div className="flex-1 min-w-0 md:mb-2">
                            <h1 id="company-title" className="text-xl md:text-2xl font-black text-slate-800 mb-2">
                                {company.name}
                            </h1>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 font-medium">
                                {company.website && (
                                    <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#00b14f] transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">language</span> {company.website}
                                    </a>
                                )}
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[18px]">group</span> Quy mô: {company.size || 'Chưa cập nhật'}
                                </span>
                            </div>
                        </div>

                        {/* NHÓM CTA ACTIONS */}
                        <div className="flex-shrink-0 w-full md:w-auto flex items-center gap-2 md:mb-2">
                            <div className="flex-1 md:flex-none">
                                <FollowButton
                                    companyId={company.id}
                                    initialFollowed={initialFollowed}
                                    isLoggedIn={isLoggedIn}
                                />
                            </div>
                            <ShareButton />
                        </div>
                    </div>

                    {/* INTERACTIVE STICKY TABS */}
                    <CompanyTabs hasImages={hasImages} hasJobs={hasJobs} />

                    {/* 3. CHI TIẾT NỘI DUNG CHIA 2 CỘT */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 items-start">

                        {/* CỘT TRÁI (2/3): GIỚI THIỆU & VIỆC LÀM & ẢNH */}
                        <div className="lg:col-span-2 space-y-12">
                            <section id="intro" className="scroll-mt-36" aria-labelledby="company-intro-heading">
                                <h2 id="company-intro-heading" className="text-lg font-bold text-slate-850 border-l-4 border-[#00b14f] pl-3 mb-6">
                                    Giới thiệu công ty
                                </h2>
                                <p className="text-sm text-slate-655 leading-relaxed whitespace-pre-line">
                                    {company.description || "Chưa có bài viết mô tả chi tiết cho công ty này."}
                                </p>
                            </section>

                            {/* HÌNH ẢNH HOẠT ĐỘNG CỦA CÔNG TY */}
                            {hasImages && (
                                <CompanyImages images={company.images as string[]} companyName={company.name} />
                            )}

                            <section id="jobs" className="pt-10 border-t border-slate-100 animate-fadeIn scroll-mt-36" aria-labelledby="company-jobs-heading">
                                <h2 id="company-jobs-heading" className="text-lg font-bold text-slate-850 border-l-4 border-[#00b14f] pl-3 mb-6">
                                    Tuyển dụng ({company.jobs?.length || 0})
                                </h2>
                                <CompanyJobsList jobs={company.jobs} />
                            </section>
                        </div>

                        {/* CỘT PHẢI (1/3): THÔNG TIN BỔ TRỢ - STICKY */}
                        <aside className="lg:col-span-1 lg:border-l lg:border-slate-100 lg:pl-8 space-y-6 lg:sticky lg:top-28 h-fit">
                            <section aria-labelledby="company-contact-heading">
                                <h2 id="company-contact-heading" className="text-base font-bold text-slate-850 border-b border-slate-100 pb-3 mb-4">
                                    Thông tin liên hệ
                                </h2>

                                <div className="space-y-5 text-sm">
                                    <div className="flex gap-3.5 items-start">
                                        <span className="w-9 h-9 rounded-xl bg-[#00b14f]/8 flex items-center justify-center text-[#00b14f] flex-shrink-0">
                                            <span className="material-symbols-outlined text-[20px]">location_on</span>
                                        </span>
                                        <div>
                                            <p className="font-bold text-slate-700 mb-0.5">Địa chỉ công ty</p>
                                            <address className="text-slate-550 text-xs leading-relaxed not-italic">
                                                {company.addressDetail ? `${company.addressDetail}, ` : ''}
                                                {company.ward?.district?.province
                                                    ? `${company.ward.name}, ${company.ward.district.name}, ${company.ward.district.province.name}`
                                                    : 'Toàn quốc'
                                                }
                                            </address>
                                        </div>
                                    </div>

                                    <div className="flex gap-3.5 items-start">
                                        <span className="w-9 h-9 rounded-xl bg-[#00b14f]/8 flex items-center justify-center text-[#00b14f] flex-shrink-0">
                                            <span className="material-symbols-outlined text-[20px]">business_center</span>
                                        </span>
                                        <div>
                                            <p className="font-bold text-slate-700 mb-0.5">Lĩnh vực hoạt động</p>
                                            <p className="text-slate-550 text-xs">{company.industry || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </aside>
                    </div>
                </div>
            </div>
        </main>
    );
}