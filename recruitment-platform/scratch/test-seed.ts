import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { fixInvalidCompanySize } from "../lib/prismaSafe";

async function ensureSeededData() {
    try {
        console.log("Starting fixInvalidCompanySize...");
        await fixInvalidCompanySize(prisma);
        
        console.log("Seeding Province, District, Ward...");
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
            console.log("Province, District, Wards created!");
        } else {
            console.log("Province already exists");
        }

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
                console.log(`Hashing password for employer ${i + 1}...`);
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
            console.log("Companies created!");
        }

        const companies = await prisma.company.findMany({
            select: { id: true, name: true },
        });
        const companyMap = new Map(companies.map(c => [c.name, c.id]));

        console.log("Seeding Jobs...");
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
            console.log("Jobs created!");
        }

        console.log("Seeding Resume Templates...");
        let templatesCount = await prisma.resumeTemplate.count();
        if (templatesCount === 0) {
            await prisma.resumeTemplate.createMany({
                data: [
                    {
                        name: "Mẫu Đảo Ngọc Sang Trọng (Modern)",
                        slug: "mau-dao-ngoc-sang-trong",
                        description: "Thiết kế hiện đại, phối màu biển khơi dịu mát rất thích hợp cho ngành nhà hàng, du lịch dịch vụ cao cấp.",
                        thumbnailUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&auto=format&fit=crop&q=60",
                        htmlContent: `
                            <div class="resume-wrapper p-8 bg-white border border-[#edf0ff] rounded-xl shadow-sm text-on-surface" style="font-family: 'Inter', sans-serif;">
                                <div class="flex flex-col md:flex-row justify-between items-start border-b-2 border-primary pb-6 mb-6">
                                    <div>
                                        <h1 class="text-3xl font-extrabold text-primary mb-1">{{name}}</h1>
                                        <p class="text-lg font-semibold text-secondary mb-2">{{title}}</p>
                                        <p class="text-sm text-outline flex items-center gap-1">
                                            <span class="material-symbols-outlined text-[16px]">location_on</span> {{address}}
                                        </p>
                                    </div>
                                    <div class="mt-4 md:mt-0 text-sm text-on-surface-variant flex flex-col gap-1.5 md:items-end">
                                        <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">mail</span> {{email}}</span>
                                        <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">phone</span> {{phone}}</span>
                                    </div>
                                </div>
                                <div class="mb-6">
                                    <h2 class="text-lg font-bold text-primary border-b border-outline-variant pb-1.5 mb-3">Tóm tắt nghề nghiệp</h2>
                                    <p class="text-body-md text-on-surface-variant leading-relaxed">{{summary}}</p>
                                </div>
                                <div class="mb-6">
                                    <h2 class="text-lg font-bold text-primary border-b border-outline-variant pb-1.5 mb-3">Học vấn</h2>
                                    {{#each education}}
                                    <div class="mb-3">
                                        <div class="flex justify-between font-semibold">
                                            <span>{{school}} - {{degree}}</span>
                                            <span class="text-sm text-outline">{{startYear}} - {{endYear}}</span>
                                        </div>
                                        <p class="text-sm text-on-surface-variant mt-0.5">{{field}} {{#if GPA}}(GPA: {{GPA}}){{/if}}</p>
                                        <p class="text-sm text-outline mt-1">{{description}}</p>
                                    </div>
                                    {{/each}}
                                </div>
                                <div>
                                    <h2 class="text-lg font-bold text-primary border-b border-outline-variant pb-1.5 mb-3">Kinh nghiệm làm việc</h2>
                                    {{#each experience}}
                                    <div class="mb-3">
                                        <div class="flex justify-between font-semibold">
                                            <span>{{company}} - {{position}}</span>
                                            <span class="text-sm text-outline">{{startYear}} - {{endYear}}</span>
                                        </div>
                                        <p class="text-sm text-on-surface-variant mt-1">{{description}}</p>
                                    </div>
                                    {{/each}}
                                </div>
                            </div>
                        `,
                        cssContent: `
                            .resume-wrapper { max-width: 800px; margin: auto; }
                        `,
                        category: "MODERN",
                        isActive: true
                    },
                    {
                        name: "Mẫu Thanh Lịch Tối Giản (Minimalist)",
                        slug: "mau-thanh-lich-toi-gian",
                        description: "Giao diện tối giản, tập trung tối đa vào thông tin chuyên môn, hoàn hảo cho các vị trí quản lý hoặc kỹ thuật.",
                        thumbnailUrl: "https://images.unsplash.com/photo-1626197031507-c1709955b04a?w=400&auto=format&fit=crop&q=60",
                        htmlContent: `
                            <div class="resume-wrapper p-8 bg-white border border-gray-200 text-[#212f3f]" style="font-family: Arial, sans-serif;">
                                <div class="text-center border-b border-gray-300 pb-6 mb-6">
                                    <h1 class="text-3xl font-bold uppercase tracking-wider text-gray-800">{{name}}</h1>
                                    <p class="text-md text-gray-600 font-medium mt-1">{{title}}</p>
                                    <div class="flex justify-center gap-6 mt-3 text-sm text-gray-500">
                                        <span>{{email}}</span>
                                        <span>•</span>
                                        <span>{{phone}}</span>
                                        <span>•</span>
                                        <span>{{address}}</span>
                                    </div>
                                </div>
                                <div class="mb-6">
                                    <h2 class="text-sm font-bold uppercase tracking-widest text-gray-800 border-l-4 border-gray-800 pl-2 mb-3">Mục tiêu</h2>
                                    <p class="text-sm text-gray-600 leading-relaxed">{{summary}}</p>
                                </div>
                                <div class="mb-6">
                                    <h2 class="text-sm font-bold uppercase tracking-widest text-gray-800 border-l-4 border-gray-800 pl-2 mb-3">Kinh nghiệm</h2>
                                    {{#each experience}}
                                    <div class="mb-4">
                                        <div class="flex justify-between text-sm font-bold">
                                            <span>{{company}}</span>
                                            <span>{{startYear}} - {{endYear}}</span>
                                        </div>
                                        <p class="text-xs text-gray-500 italic mt-0.5">{{position}}</p>
                                        <p class="text-sm text-gray-600 mt-1">{{description}}</p>
                                    </div>
                                    {{/each}}
                                </div>
                            </div>
                        `,
                        cssContent: "",
                        category: "PROFESSIONAL",
                        isActive: true
                    }
                ]
            });
            console.log("Resume Templates created!");
        }

        console.log("Database seeding completed successfully!");
    } catch (e) {
        console.error("Seeding error:", e);
    }
}

ensureSeededData()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
