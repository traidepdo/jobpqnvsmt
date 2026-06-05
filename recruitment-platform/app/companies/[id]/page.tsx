'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatSalary } from '@/lib/jobLabels';

interface Job {
    id: string;
    title: string;
    slug: string;
    salaryMin: number | null;
    salaryMax: number | null;
    type: string;
    experience: string | null;
    deadline: string | null;
    category: { name: string };
}

interface CompanyDetail {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    website: string | null;
    description: string | null;
    size: string | null;
    industry: string | null;
    addressDetail: string | null;
    ward: {
        name: string;
        district: {
            name: string;
            province: { name: string };
        };
    } | null;
    jobs: Job[];
}

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // FIX NEXT.JS 15+: Sử dụng React.use() để mở gói Promise params một cách an toàn
    const unwrappedParams = React.use(params);
    const companyIdFromUrl = unwrappedParams.id;

    const [company, setCompany] = useState<CompanyDetail | null>(null);
    const [isFollowed, setIsFollowed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        // Gọi API lấy thông tin chi tiết bằng ID thay vì slug
        fetch(`/api/companies/${companyIdFromUrl}`)
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    setCompany(data.company);
                    // Kiểm tra trạng thái follow dựa trên ID
                    checkFollowStatus(data.company.id);
                }
            })
            .catch(err => console.error("Lỗi fetch chi tiết công ty:", err))
            .finally(() => setLoading(false));
    }, [companyIdFromUrl]);

    useEffect(() => {
        if (company) {
            document.title = `${company.name} - Tuyển dụng & Giới thiệu | Phú Quốc Jobs`;
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            const descText = `Thông tin tuyển dụng mới nhất từ ${company.name} tại Phú Quốc. Địa chỉ: ${company.addressDetail || ''}. Tìm kiếm việc làm phù hợp và nộp đơn ngay!`;
            metaDesc.setAttribute('content', descText);
        }
    }, [company]);

    const checkFollowStatus = (id: string) => {
        fetch(`/api/companies/${id}/follow`)
            .then(res => res.json())
            .then(data => setIsFollowed(data.followed))
            .catch(() => setIsFollowed(false));
    };

    const handleFollowToggle = async () => {
        if (!company || followLoading) return;
        setFollowLoading(true);

        try {
            const res = await fetch(`/api/companies/${company.id}/follow`, { method: 'PATCH' });
            const data = await res.json();
            if (res.ok) {
                setIsFollowed(data.followed);
            } else {
                alert(data.error || "Có lỗi xảy ra, vui lòng thử lại");
            }
        } catch {
            alert("Lỗi kết nối máy chủ");
        } finally {
            setFollowLoading(false);
        }
    };
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
            </div>
        );
    }

    if (!company) {
        return (
            <div className="text-center py-20 text-gray-500 bg-gray-50 min-h-screen">
                <span className="material-symbols-outlined text-5xl text-gray-300 mb-2 block">business</span>
                Công ty không tồn tại hoặc đã bị ẩn.
            </div>
        );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phuquocjobs.vn';

    const companySchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': company.name,
        'url': baseUrl + '/companies/' + companyIdFromUrl,
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
                'item': `${baseUrl}/companies/${companyIdFromUrl}`,
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
        <>
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
            <div className="bg-gray-100/60 min-h-screen pb-12">
                {/* BANNER HEADER */}
                <div className="bg-white border-b border-gray-200 shadow-sm">
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
                                <h1 className="text-xl md:text-2xl font-bold text-white md:text-[#041b3c] drop-shadow md:drop-shadow-none mb-2">
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

                            {/* NÚT THEO DÕI */}
                            <div className="flex-shrink-0 w-full md:w-auto md:mb-2">
                                <button
                                    onClick={handleFollowToggle}
                                    disabled={followLoading}
                                    className={`w-full md:w-auto px-6 py-2.5 font-bold rounded-lg text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${isFollowed
                                        ? "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                                        : "bg-[#00b14f] text-white border-[#00b14f] hover:bg-[#009940]"
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        {isFollowed ? "check_circle" : "add"}
                                    </span>
                                    {isFollowed ? "Đang theo dõi" : "Theo dõi công ty"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CHI TIẾT NỘI DUNG CHIA 2 CỘT */}
                <div className="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* CỘT TRÁI: GIỚI THIỆU & VIỆC LÀM ĐANG TUYỂN */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#041b3c] border-l-4 border-[#00b14f] pl-3 mb-4">
                                Giới thiệu công ty
                            </h2>
                            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                                {company.description || "Chưa có bài viết mô tả chi tiết cho công ty này."}
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h2 className="text-lg font-bold text-[#041b3c] border-l-4 border-[#00b14f] pl-3 mb-4">
                                Tuyển dụng ({company.jobs?.length || 0})
                            </h2>

                            {!company.jobs || company.jobs.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 text-sm">
                                    Hiện tại doanh nghiệp chưa đăng tin tuyển dụng mới nào.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {company.jobs.map((job) => (
                                        <div key={job.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50/50 hover:border-[#00b14f]/50 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
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
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CỘT PHẢI: THÔNG TIN BỔ TRỢ */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h2 className="text-base font-bold text-[#041b3c] border-b pb-3 mb-4">
                                Thông tin liên hệ
                            </h2>

                            <div className="space-y-4 text-sm">
                                <div className="flex gap-3 items-start">
                                    <span className="material-symbols-outlined text-gray-400 text-[20px] mt-0.5">location_on</span>
                                    <div>
                                        <p className="font-medium text-gray-700 mb-0.5">Địa chỉ công ty</p>
                                        <p className="text-gray-500 text-xs leading-relaxed">
                                            {company.addressDetail ? `${company.addressDetail}, ` : ''}
                                            {company.ward?.district?.province
                                                ? `${company.ward.name}, ${company.ward.district.name}, ${company.ward.district.province.name}`
                                                : 'Toàn quốc'
                                            }
                                        </p>
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
                        </div>
                    </div>
                </div>
            </div>
        </>

    );
}