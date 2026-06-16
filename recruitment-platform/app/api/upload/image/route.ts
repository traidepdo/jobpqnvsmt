// app/api/upload/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
    try {
        // Authenticate request
        const token = (await cookies()).get('token')?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized: Vui lòng đăng nhập" }, { status: 401 });
        }
        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: "Unauthorized: Phiên làm việc không hợp lệ" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "Không có file" }, { status: 400 });
        }

        const isImage = file.type.startsWith("image/");
        const isDoc = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ].includes(file.type) || /\.(pdf|doc|docx)$/i.test(file.name);

        if (!isImage && !isDoc) {
            return NextResponse.json({ error: "Chỉ chấp nhận file ảnh hoặc tài liệu (PDF, Word)" }, { status: 400 });
        }

        // Giới hạn 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File tối đa 5MB" }, { status: 400 });
        }

        // Convert file → base64
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        const dataUri = `data:${file.type || "application/octet-stream"};base64,${base64}`;

        // Upload lên Cloudinary
        const uploadOptions: any = {
            folder: isImage ? "cv-avatars" : "cv-documents",
        };

        if (isImage) {
            uploadOptions.transformation = [
                { width: 400, height: 400, crop: "fill", gravity: "face" },
                { quality: "auto", fetch_format: "auto" },
            ];
        } else {
            uploadOptions.resource_type = "raw";
            uploadOptions.type = "authenticated";
            const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '.pdf';
            const uniqueId = `cv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            uploadOptions.public_id = `${uniqueId}${ext}`;
        }

        const result = await cloudinary.uploader.upload(dataUri, uploadOptions);

        return NextResponse.json({
            ok: true,
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload thất bại" }, { status: 500 });
    }
}