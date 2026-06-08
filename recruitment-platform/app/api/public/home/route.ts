import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { companyCardSelect, fixInvalidCompanySize } from "@/lib/prismaSafe";
import { getLatestModel, predictSalary } from "@/lib/salaryPredictor";

let isAlreadySeeded = false;

// Helper to seed data if database is empty
async function ensureSeededData() {
    if (isAlreadySeeded) return;
    try {
        await fixInvalidCompanySize(prisma);
        // 1. Seed Province, District, Ward if Wards are empty
        let province = await prisma.province.findFirst();
        let district;
        if (!province) {
            province = await prisma.province.create({
                data: {
                    name: "Kiên Giang",
                    slug: "kien-giang",
                }
            });
            district = await prisma.district.create({
                data: {
                    name: "Phú Quốc",
                    slug: "phu-quoc",
                    provinceId: province.id
                }
            });
            await prisma.ward.createMany({
                data: [
                    { name: "Dương Đông", slug: "duong-dong", districtId: district.id },
                    { name: "An Thới", slug: "an-thoi", districtId: district.id },
                    { name: "Hàm Ninh", slug: "ham-ninh", districtId: district.id },
                    { name: "Gành Dầu", slug: "ganh-dau", districtId: district.id }
                ]
            });
        }

        // Fetch seeded wards
        const wards = await prisma.ward.findMany();
        const wardMap = new Map(wards.map(w => [w.name, w.id]));

        // 2. Seed Users if empty
        const employerEmails = [
            "employer@phuquocjobs.com",
            "employer2@phuquocjobs.com",
            "employer3@phuquocjobs.com",
            "employer4@phuquocjobs.com"
        ];
        const employers = [];
        const hashedPassword = await bcrypt.hash("Password123", 10);

        for (let i = 0; i < employerEmails.length; i++) {
            const email = employerEmails[i];
            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        name: i === 0 ? "Sun Group HR" : `Employer HR ${i + 1}`,
                        email,
                        password: hashedPassword,
                        role: "EMPLOYER",
                        phone: `098765432${i + 1}`,
                        isActive: true
                    }
                });
            }
            employers.push(user);
        }

        let candidateUser = await prisma.user.findFirst({ where: { role: "CANDIDATE" } });
        if (!candidateUser) {
            candidateUser = await prisma.user.create({
                data: {
                    name: "Nguyễn Văn A",
                    email: "candidate@phuquocjobs.com",
                    password: hashedPassword,
                    role: "CANDIDATE",
                    phone: "0123456789",
                    isActive: true
                }
            });
        }

        // 3. Seed Categories if empty
        let categoriesCount = await prisma.category.count();
        if (categoriesCount === 0) {
            await prisma.category.createMany({
                data: [
                    { name: "Hotel", slug: "hotel", icon: "hotel" },
                    { name: "Restaurant", slug: "restaurant", icon: "restaurant" },
                    { name: "Tour Guide", slug: "tour-guide", icon: "explore" },
                    { name: "Security", slug: "security", icon: "security" }
                ]
            });
        }

        const categories = await prisma.category.findMany();
        const categoryMap = new Map(categories.map(c => [c.name, c.id]));

        // 4. Seed Companies if empty
        let companiesCount = await prisma.company.count();
        if (companiesCount === 0) {
            await prisma.company.createMany({
                data: [
                    {
                        name: "VinWonders Phu Quoc",
                        slug: "vinwonders-phu-quoc",
                        logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIeTR1L25yDCcifcdeUql2ZQNFSLqT1Htwqwlgs9Xhy1t9Te_lIhlsmoZxoKtfcbo0VSJDmWeyeDCV6vpgTugV3W4JzQzBqDhhC7l095ZftIPPng4HRvcX8M4-YPPcwp5MYqTMCw3qU1l9oMGCde_tCPyLiAFOZoTr-m_d2g4wBHvvxa-GdwvD6BBSmcnvJrWcAcyYfi23O2dj2tcMIbb7PRZbiWhxSrO-EFH_rPJIbvBHlIYQ-ZYjEzRbhDEBhpMK9MjDehILpBgR",
                        website: "https://vinwonders.com",
                        description: "VinWonders Phú Quốc là công viên chủ đề lớn nhất Việt Nam, quy mô hàng đầu châu Á với các hoạt động giải trí đỉnh cao.",
                        wardId: wardMap.get("Gành Dầu"),
                        addressDetail: "Khu Bãi Dài, Gành Dầu, Phú Quốc",
                        size: "ENTERPRISE",
                        industry: "Vui chơi & Giải trí",
                        ownerId: employers[1].id,
                        isApproved: true,
                        isActive: true
                    },
                    {
                        name: "Sun World Resort & Spa",
                        slug: "sun-world-resort-spa",
                        logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDJ34PSplwETbmyHZHr9z5Fv6t-R6gfK68TGefZAq-lV2rSCGwANyHuoUfRm-qut6YGwY_VN_c5oHAN0L7e4Dey2hkbV9DztlN7K7uRqnpIAbBrIADGMcPBQCQpJxZlslIkgiGYBAkU2JK8bF1sB06Jvl25IthCaPCkWuzc5x3qgd8CtLOjuMl3MzqTvjEJTSL6wXitY9CtkKmwp4WJ3_mJk-ckB5lvjJ5QeNgpiUY9ADuAnseIbiJLtPCN3M8LJsLohCFCJSzQdUtH",
                        website: "https://sungroup.com.vn",
                        description: "Tập đoàn Sun Group tập trung vào các lĩnh vực vui chơi giải trí, du lịch nghỉ dưỡng và hạ tầng đẳng cấp.",
                        wardId: wardMap.get("An Thới"),
                        addressDetail: "Bãi Đất Đỏ, An Thới, Phú Quốc",
                        size: "ENTERPRISE",
                        industry: "Khách sạn & Du lịch",
                        ownerId: employers[0].id,
                        isApproved: true,
                        isActive: true
                    },
                    {
                        name: "Ocean Breeze Dining",
                        slug: "ocean-breeze-dining",
                        logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvakBxWam5BMK7IB0oHTJYWuYYwSYl-1zYRtB6_IZsDtx_QsPGdZ4aQUz6SiwmLtA8Mm00tfJdgmItId5y4TaR7jfHgVO02NwRxBXZ-vbnlDV9PehuYyAdzb7P-A4UUbexfzwxwUnfxtZSlwP2BMoWzgo2bL-TwMQoH55ySHslk4vLMiaZplBNmtHL5q76Ia4syQ5BbvUO8uSNsOfdNWQhtszrgO3yTWyg5XRxwk2c7xVQwWwu1Sn0E5UK7xbeURbYp0jMkf32lnjD",
                        website: "https://oceanbreezedining.com",
                        description: "Nhà hàng hải sản tươi sống cao cấp tại làng chài Hàm Ninh, mang phong cách ẩm thực đại dương trứ danh.",
                        wardId: wardMap.get("Hàm Ninh"),
                        addressDetail: "Rạch Hàm, Hàm Ninh, Phú Quốc",
                        size: "MEDIUM",
                        industry: "Nhà hàng & F&B",
                        ownerId: employers[2].id,
                        isApproved: true,
                        isActive: true
                    },
                    {
                        name: "Island Adventures Ltd.",
                        slug: "island-adventures-ltd",
                        logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuACy42-E9gHk-K-gI6KrMz-NyNnCNyQYwvc34VKcdhgjS2-tFQVzeQ56kYn4AVU6GxVf9q5VS8-bIaE5Lh_BAUD4qRa8toVgpFUXS4KZvzOJ4O3riQhR2pOShFPam0AjnUqZOpp_yxmix8yJagSp0bwzGYzdsJNP2hXZf2hJ6LQ9GE-ZVwx5QfXubcFgG6yu5ZotA7w13bUCkTBhGyT5ii1NgL1k6fjEW3UDPrQ-XP9taJf9UEpxQgbx7vXXpWzAs9wu4-z1XhL7DHg",
                        website: "https://islandadventures.vn",
                        description: "Đơn vị lữ hành khám phá các tour đảo, lặn ngắm san hô hàng đầu tại Phú Quốc.",
                        wardId: wardMap.get("Dương Đông"),
                        addressDetail: "Trần Hưng Đạo, Dương Đông, Phú Quốc",
                        size: "SMALL",
                        industry: "Du lịch & Lữ hành",
                        ownerId: employers[3].id,
                        isApproved: true,
                        isActive: true
                    }
                ]
            });
        }

        const companies = await prisma.company.findMany({
            select: { id: true, name: true },
        });
        const companyMap = new Map(companies.map(c => [c.name, c.id]));

        // 5. Seed Jobs if empty
        let jobsCount = await prisma.job.count();
        if (jobsCount === 0) {
            await prisma.job.createMany({
                data: [
                    {
                        title: "Receptionist (Premium Resort)",
                        slug: "receptionist-premium-resort",
                        description: "Chào đón khách hàng với thái độ chuyên nghiệp, thực hiện các thủ tục check-in/check-out và hỗ trợ khách du lịch trong suốt thời gian lưu trú tại resort cao cấp.",
                        requirements: "Tiếng Anh giao tiếp lưu loát, ngoại hình ưa nhìn, có kinh nghiệm phục vụ khách hàng tối thiểu 1 năm.",
                        benefits: "Mức lương hấp dẫn từ 8-12 triệu VND, hỗ trợ ăn ca, đóng bảo hiểm đầy đủ, có cơ hội thăng tiến lên Trưởng bộ phận lễ tân.",
                        quantity: 3,
                        salaryMin: 8,
                        salaryMax: 12,
                        type: "FULL_TIME",
                        experience: "ONE_TO_THREE_YEARS",
                        level: "JUNIOR",
                        status: "ACTIVE",
                        categoryId: categoryMap.get("Hotel")!,
                        companyId: companyMap.get("Sun World Resort & Spa")!,
                        wardId: wardMap.get("An Thới")!,
                        addressDetail: "Bãi Đất Đỏ, An Thới, Phú Quốc"
                    },
                    {
                        title: "Head Chef (Seafood Specialty)",
                        slug: "head-chef-seafood-specialty",
                        description: "Chịu trách nhiệm quản lý bếp chính, phát triển thực đơn hải sản cao cấp, quản lý chất lượng thực phẩm và điều phối hoạt động của đội ngũ nhân sự bếp.",
                        requirements: "Có tối thiểu 5 năm kinh nghiệm làm bếp trưởng tại các nhà hàng/khách sạn lớn, am hiểu sâu sắc ẩm thực hải sản.",
                        benefits: "Mức lương cạnh tranh từ 20-30 triệu VND, hưởng hoa hồng doanh số, hỗ trợ chỗ ở cho nhân viên ở xa.",
                        quantity: 1,
                        salaryMin: 20,
                        salaryMax: 30,
                        type: "FULL_TIME",
                        experience: "OVER_FIVE_YEARS",
                        level: "LEAD",
                        status: "ACTIVE",
                        categoryId: categoryMap.get("Restaurant")!,
                        companyId: companyMap.get("Ocean Breeze Dining")!,
                        wardId: wardMap.get("Hàm Ninh")!,
                        addressDetail: "Rạch Hàm, Hàm Ninh, Phú Quốc"
                    },
                    {
                        title: "English Tour Guide",
                        slug: "english-tour-guide",
                        description: "Dẫn dắt các đoàn khách quốc tế tham quan Nam đảo, các hòn đảo hoang sơ và hướng dẫn các hoạt động lặn biển giải trí.",
                        requirements: "Có thẻ hướng dẫn viên du lịch quốc tế, kỹ năng giao tiếp tốt, yêu thích thiên nhiên và hoạt động thể thao ngoài trời.",
                        benefits: "Thu nhập ổn định 10-15 triệu VND cộng tip từ khách hàng, được đào tạo chuyên sâu về kỹ năng sinh tồn và lặn biển.",
                        quantity: 5,
                        salaryMin: 10,
                        salaryMax: 15,
                        type: "CONTRACT",
                        experience: "UNDER_1_YEAR",
                        level: "MID",
                        status: "ACTIVE",
                        categoryId: categoryMap.get("Tour Guide")!,
                        companyId: companyMap.get("Island Adventures Ltd.")!,
                        wardId: wardMap.get("Dương Đông")!,
                        addressDetail: "Trần Hưng Đạo, Dương Đông, Phú Quốc"
                    },
                    {
                        title: "Security Supervisor",
                        slug: "security-supervisor",
                        description: "Giám sát hoạt động an ninh, vận hành trung tâm camera giám sát và quản lý lịch trực của lực lượng bảo vệ tại công viên VinWonders.",
                        requirements: "Có kinh nghiệm giám sát an ninh hoặc xuất thân từ lực lượng vũ trang giải ngũ, kỹ năng xử lý tình huống khẩn cấp tốt.",
                        benefits: "Mức lương 12-18 triệu VND, cơm ca miễn phí, chế độ chăm sóc sức khỏe đặc biệt từ Vingroup.",
                        quantity: 2,
                        salaryMin: 12,
                        salaryMax: 18,
                        type: "FULL_TIME",
                        experience: "THREE_TO_FIVE_YEARS",
                        level: "SENIOR",
                        status: "ACTIVE",
                        categoryId: categoryMap.get("Security")!,
                        companyId: companyMap.get("VinWonders Phu Quoc")!,
                        wardId: wardMap.get("Gành Dầu")!,
                        addressDetail: "Khu Bãi Dài, Gành Dầu, Phú Quốc"
                    }
                ]
            });
        }

        // 6. Seed Resume Templates
        const defaultTemplates = [
            {
                name: "Mẫu Cổ điển (Classic)",
                slug: "classic",
                description: "Phong cách thanh lịch, truyền thống. Thích hợp cho mọi ngành nghề.",
                thumbnailUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&auto=format&fit=crop&q=60",
                htmlContent: "",
                cssContent: "",
                category: "BASIC" as const,
                isActive: true
            },
            {
                name: "Mẫu Hiện đại (Modern)",
                slug: "modern",
                description: "Thiết kế hiện đại, phối màu thanh lịch, tối giản và sắc nét.",
                thumbnailUrl: "https://images.unsplash.com/photo-1626197031507-c1709955b04a?w=400&auto=format&fit=crop&q=60",
                htmlContent: "",
                cssContent: "",
                category: "MODERN" as const,
                isActive: true
            },
            {
                name: "Mẫu Sáng tạo (Creative)",
                slug: "creative",
                description: "Phối màu cá tính, bố cục độc đáo giúp bạn nổi bật.",
                thumbnailUrl: "https://images.unsplash.com/photo-1616628188506-4bd8d62c9088?w=400&auto=format&fit=crop&q=60",
                htmlContent: "",
                cssContent: "",
                category: "CREATIVE" as const,
                isActive: true
            },
            {
                name: "Mẫu Thanh lịch (Elegant)",
                slug: "elegant",
                description: "Thiết kế mềm mại, tinh tế, phù hợp các công việc dịch vụ, nghệ thuật.",
                thumbnailUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop&q=60",
                htmlContent: "",
                cssContent: "",
                category: "PROFESSIONAL" as const,
                isActive: true
            },
            {
                name: "Mẫu Tương lai (Futuristic)",
                slug: "futuristic",
                description: "Phong cách công nghệ cao, hiện đại và đột phá.",
                thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=60",
                htmlContent: "",
                cssContent: "",
                category: "CREATIVE" as const,
                isActive: true
            },
            {
                name: "Mẫu Tối giản Modern (Minimalist)",
                slug: "minimalist",
                description: "Tối giản thông tin, gọn gàng, bố cục rõ ràng chuyên nghiệp.",
                thumbnailUrl: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=400&auto=format&fit=crop&q=60",
                htmlContent: "",
                cssContent: "",
                category: "BASIC" as const,
                isActive: true
            }
        ];

        for (const t of defaultTemplates) {
            await prisma.resumeTemplate.upsert({
                where: { slug: t.slug },
                update: {
                    name: t.name,
                    description: t.description,
                    thumbnailUrl: t.thumbnailUrl,
                    category: t.category,
                    isActive: t.isActive,
                },
                create: t,
            });
        }
        isAlreadySeeded = true;
    } catch (e) {
        console.error("Seeding error:", e);
    }
}

export async function GET() {
    try {
        // Ensure seeded data is present first
        await ensureSeededData();

        // 1. Fetch categories
        let categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: {
                        jobs: {
                            where: { status: "ACTIVE" }
                        }
                    }
                }
            }
        });

        // 2. Fetch featured jobs (real dynamic data)
        let featuredJobsRaw = await prisma.job.findMany({
            where: { status: "ACTIVE" },
            take: 4,
            orderBy: { createdAt: "desc" },
            include: {
                company: { select: companyCardSelect },
                category: {
                    select: {
                        name: true
                    }
                },
                ward: {
                    select: {
                        name: true
                    }
                }
            }
        });

        const model = await getLatestModel();
        const featuredJobs = featuredJobsRaw.map(job => {
          const min = job.salaryMin;
          const max = job.salaryMax;
          
          let actualSalary: number | null = null;
          if (min !== null && max !== null) {
            actualSalary = (min + max) / 2;
          } else if (min !== null) {
            actualSalary = min;
          } else if (max !== null) {
            actualSalary = max;
          }
          
          let salaryStatus: 'good' | 'average' | 'bad' | null = null;
          let salaryDiff = 0;
          
          if (actualSalary !== null) {
            if (actualSalary > 100000) {
              actualSalary = actualSalary / 1000000;
            }
            
            const predicted = predictSalary({
              experience: job.experience,
              level: job.level,
              type: job.type,
              categoryId: job.categoryId,
              wardId: job.wardId,
            }, model);
            
            salaryDiff = Math.round(((actualSalary - predicted) / predicted) * 100);
            if (actualSalary >= 1.15 * predicted) {
              salaryStatus = 'good';
            } else if (actualSalary < 0.9 * predicted) {
              salaryStatus = 'bad';
            } else {
              salaryStatus = 'average';
            }
          }
          
          return {
            ...job,
            salaryStatus,
            salaryDiff
          };
        });

        // 3. Fetch companies
        let companies = await prisma.company.findMany({
            where: { isApproved: true, isActive: true },
            take: 6,
            select: companyCardSelect,
        });

        // 4. Fetch wards for search filter
        let wards = await prisma.ward.findMany({
            select: {
                id: true,
                name: true
            }
        });

        return NextResponse.json({
            categories,
            featuredJobs,
            companies,
            wards
        }, { status: 200 });

    } catch (error) {
        console.error("Error loading public home data:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
