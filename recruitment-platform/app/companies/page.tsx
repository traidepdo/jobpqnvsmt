'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Company {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    industry: string | null;
    size: string | null;
    description: string | null;
    ward: {
        name: string;
        district: {
            name: string;
            province: { name: string };
        };
    } | null;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const INDUSTRIES = [
    { label: "Tất cả ngành nghề", value: "" },
    { label: "Công nghệ thông tin", value: "IT" },
    { label: "Kinh doanh / Marketing", value: "Marketing" },
    { label: "Kế toán / Kiểm toán", value: "Accounting" },
    { label: "Nhân sự", value: "HR" },
    { label: "Du lịch / Nhà hàng / Khách sạn", value: "Hospitality" },
    { label: "Ngôn ngữ / Biên phiên dịch", value: "Language" },
];

export default function CompaniesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const currentIndustry = searchParams.get('industry') || '';
    const currentSearch = searchParams.get('search') || '';

    const [companies, setCompanies] = useState<Company[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState(currentSearch);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams(searchParams.toString());

        // Đảm bảo có dấu gạch chéo '/' ở đầu để tránh nhận diện nhầm URL con
        fetch(`/api/companies?${params.toString()}`)
            .then((r) => {
                if (!r.ok) {
                    throw new Error("Phản hồi từ Server không hợp lệ");
                }
                return r.json();
            })
            .then((data) => {
                if (data.ok) {
                    setCompanies(data.companies || []);
                    setPagination(data.pagination || null);
                } else {
                    console.error("Server báo lỗi dữ liệu:", data.error);
                }
            })
            .catch((err) => {
                console.error("Lỗi kết nối Fetch tại Frontend:", err);
            })
            .finally(() => setLoading(false));
    }, [searchParams]);

    const updateFilters = (newFilters: { industry?: string; search?: string; page?: string }) => {
        const params = new URLSearchParams(searchParams.toString());

        if (newFilters.industry !== undefined) {
            if (newFilters.industry) params.set('industry', newFilters.industry);
            else params.delete('industry');
            params.set('page', '1');
        }

        if (newFilters.search !== undefined) {
            if (newFilters.search) params.set('search', newFilters.search);
            else params.delete('search');
            params.set('page', '1');
        }

        if (newFilters.page !== undefined) {
            params.set('page', newFilters.page);
        }

        startTransition(() => {
            router.push(`/companies?${params.toString()}`);
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilters({ search: searchInput });
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 min-h-screen bg-gray-50/50">
            {/* Tiêu đề */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#041b3c] mb-2">Khám phá các Công ty nổi bật</h1>
                <p className="text-sm text-gray-500">Tìm kiếm môi trường làm việc lý tưởng và theo dõi để nhận tin tuyển dụng mới nhất.</p>
            </div>

            {/* Thanh tìm kiếm và bộ lọc */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 mb-6">
                <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Nhập tên công ty cần tìm..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00b14f] focus:bg-white transition-all"
                        />
                    </div>
                    <button type="submit" className="px-5 py-2.5 bg-[#00b14f] text-white font-bold rounded-lg text-sm hover:bg-[#009940] transition-colors">
                        Tìm kiếm
                    </button>
                </form>

                <div className="w-full md:w-64">
                    <select
                        value={currentIndustry}
                        onChange={(e) => updateFilters({ industry: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00b14f] focus:bg-white transition-all cursor-pointer"
                    >
                        {INDUSTRIES.map((ind) => (
                            <option key={ind.value} value={ind.value}>
                                {ind.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Vùng hiển thị danh sách */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-10 h-10 border-[3px] border-gray-200 border-t-[#00b14f] rounded-full animate-spin" />
                </div>
            ) : companies.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">business_disabled</span>
                    <p className="font-semibold text-gray-600 mb-1 text-base">Không tìm thấy công ty nào phù hợp</p>
                    <p className="text-sm text-gray-400">Hãy thử thay đổi từ khóa hoặc bộ lọc ngành nghề xem sao nhé.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {companies.map((company) => (
                            <div
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
                            </div>
                        ))}
                    </div>

                    {/* Điều khiển phân trang */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <button
                                disabled={pagination.page === 1 || isPending}
                                onClick={() => updateFilters({ page: (pagination.page - 1).toString() })}
                                className="p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white text-gray-600 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px] block">chevron_left</span>
                            </button>

                            <span className="text-sm font-medium text-gray-600 px-3">
                                Trang {pagination.page} / {pagination.totalPages}
                            </span>

                            <button
                                disabled={pagination.page === pagination.totalPages || isPending}
                                onClick={() => updateFilters({ page: (pagination.page + 1).toString() })}
                                className="p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white text-gray-600 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px] block">chevron_right</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}