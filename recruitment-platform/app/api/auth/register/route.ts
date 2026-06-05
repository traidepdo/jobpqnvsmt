import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    try {
        // ĐỌC MỘT LẦN DUY NHẤT Ở ĐÂY
        const body = await req.json();
        console.log("--- DATA FRONTEND GỬI LÊN ---", body);

        // Lấy dữ liệu từ biến body ra, không dùng await req.json() nữa
        const { name, email, password, compassword, role, phone } = body;

        // KIỂM TRA DỮ LIỆU
        // Nếu Frontend chưa gửi compassword, tạm thời bỏ '!compassword' ở đây để test không bị lỗi 400
        if (!name || !email || !password || !role || !phone) {
            console.log("Bị thiếu trường:", { name, email, password, role, phone });
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Kiểm tra xem email đã tồn tại chưa
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (user) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        // Logic check password trùng khớp (Chỉ bật khi frontend đã gửi kèm compassword)
        if (compassword && password !== compassword) {
            return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
        }

        // Mã hóa mật khẩu và tạo User
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                phone,
            },
        });

        return NextResponse.json(newUser, { status: 201 });

    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}