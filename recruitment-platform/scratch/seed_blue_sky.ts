import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// Simplified helper to generate CUIDs
function generateCuid(prefix = 'c') {
    const timestamp = Date.now();
    const rand = Math.floor(Math.random() * 899999) + 100000;
    return `${prefix}seed${timestamp}${rand}`;
}

async function main() {
    console.log("Starting Blue Sky seeding script...");

    // 1. Find or create "Blue Sky" company
    let company = await prisma.company.findFirst({
        where: { name: { contains: "Blue Sky", mode: "insensitive" } }
    });

    if (!company) {
        console.log("Blue Sky company not found. Looking for an employer to assign...");
        const employer = await prisma.user.findFirst({
            where: { role: "EMPLOYER" },
            include: { company: true }
        });

        if (!employer) {
            throw new Error("No employer user found in database. Run global seed first.");
        }

        if (employer.company) {
            console.log(`Renaming existing company "${employer.company.name}" of employer "${employer.name}" to "Blue Sky"`);
            company = await prisma.company.update({
                where: { id: employer.company.id },
                data: { name: "Blue Sky", slug: "blue-sky-" + Math.floor(Math.random() * 10000) }
            });
        } else {
            console.log(`Creating "Blue Sky" company for employer "${employer.name}"`);
            const ward = await prisma.ward.findFirst();
            if (!ward) throw new Error("No ward found. Seed geography first.");
            
            company = await prisma.company.create({
                data: {
                    id: generateCuid('co'),
                    name: "Blue Sky",
                    slug: "blue-sky",
                    logo: "https://picsum.photos/id/45/200/200",
                    website: "https://bluesky.example.com",
                    description: "Công ty công nghệ và giải pháp phần mềm hàng đầu Blue Sky.",
                    wardId: ward.id,
                    addressDetail: "123 Cầu Giấy, Hà Nội",
                    size: "MEDIUM",
                    industry: "IT",
                    ownerId: employer.id,
                    isApproved: true,
                    isActive: true
                }
            });
        }
    }

    console.log(`Found/Created Company: ${company.name} (${company.id})`);

    // 2. Ensure company has some jobs
    let jobs = await prisma.job.findMany({
        where: { companyId: company.id }
    });

    if (jobs.length === 0) {
        console.log("No jobs found for Blue Sky. Seeding some jobs...");
        const category = await prisma.category.findFirst();
        const ward = await prisma.ward.findFirst();
        if (!category || !ward) throw new Error("Missing categories or wards");

        const titles = ["Kỹ sư React Native / Front-End Developer", "Chuyên viên Marketing và SEO", "Lập trình viên NodeJS / Backend Developer"];
        for (const title of titles) {
            const job = await prisma.job.create({
                data: {
                    id: generateCuid('j'),
                    title,
                    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + "-" + Math.floor(Math.random() * 1000),
                    description: `Chúng tôi tìm kiếm ứng viên tài năng cho vị trí ${title} nhằm xây dựng các sản phẩm công nghệ đột phá tại Blue Sky.`,
                    requirements: "Có từ 1-2 năm kinh nghiệm thực tế. Tinh thần tự học cao, làm việc nhóm tốt.",
                    benefits: "Mức lương cạnh tranh, thưởng dự án hấp dẫn. Môi trường trẻ trung, cơ hội thăng tiến tốt.",
                    quantity: 3,
                    type: "FULL_TIME",
                    experience: "ONE_TO_THREE_YEARS",
                    level: "JUNIOR",
                    status: "ACTIVE",
                    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    isVisible: true,
                    categoryId: category.id,
                    companyId: company.id,
                    wardId: ward.id,
                    addressDetail: "Văn phòng Blue Sky, Cầu Giấy"
                }
            });
            jobs.push(job);
        }
        console.log(`Seeded ${jobs.length} jobs.`);
    }

    // 3. Create mock candidates and applications
    console.log("Seeding mock candidates and applications...");
    const candidateNames = [
        "Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Chung", "Phạm Minh Đức", 
        "Vũ Hoài Anh", "Hoàng Kim Chi", "Đỗ Quốc Bảo", "Nguyễn Tiến Đạt",
        "Phan Thanh Hà", "Dương Minh Huy", "Bùi Thị Lan", "Vũ Văn Nam",
        "Trịnh Hồng Ngọc", "Lâm Thế Phong", "Lê Văn Quân", "Nguyễn Minh Tâm"
    ];

    const statuses: ("PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED")[] = [
        "PENDING", "REVIEWING", "ACCEPTED", "REJECTED"
    ];

    let count = 0;
    for (const name of candidateNames) {
        const email = `candidate.${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "")}.${Math.floor(Math.random() * 1000)}@example.com`;
        
        // Create User
        const user = await prisma.user.create({
            data: {
                id: generateCuid('u'),
                name,
                email,
                password: "hashed_password_placeholder",
                role: "CANDIDATE",
                phone: "09" + Math.floor(10000000 + Math.random() * 90000000),
                isActive: true
            }
        });

        // Create Resume
        const resume = await prisma.resume.create({
            data: {
                id: generateCuid('r'),
                userId: user.id,
                title: `CV ${name} - Developer`,
                address: "Hà Nội",
                summary: `Tôi là một nhà phát triển phần mềm nhiệt huyết với mục tiêu đóng góp giải pháp công nghệ giá trị cho công ty.`
            }
        });

        // Choose a random job from Blue Sky
        const job = jobs[count % jobs.length];
        const status = statuses[count % statuses.length];

        // Create Application
        await prisma.application.create({
            data: {
                id: generateCuid('app'),
                userId: user.id,
                jobId: job.id,
                cvUrl: `https://example.com/cv_${user.id}.pdf`,
                resumeId: resume.id,
                coverLetter: `Kính gửi Bộ phận Tuyển dụng,\nTôi viết thư này để bày tỏ mong muốn ứng tuyển vị trí ${job.title} tại quý công ty Blue Sky.\nVới các kỹ năng và kinh nghiệm tích lũy, tôi tự tin sẽ hoàn thành xuất sắc nhiệm vụ được giao.`,
                status,
                matchScore: Math.floor(45 + Math.random() * 50), // 45 - 95
                quizScore: Math.floor(50 + Math.random() * 45)   // 50 - 95
            }
        });

        count++;
    }

    console.log(`Successfully seeded ${count} candidates and applications for Blue Sky!`);
}

main()
    .catch(e => {
        console.error("Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
