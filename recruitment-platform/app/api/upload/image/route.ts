// app/api/upload/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "Không có file" }, { status: 400 });
        }

        // Kiểm tra loại file
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Chỉ chấp nhận file ảnh" }, { status: 400 });
        }

        // Giới hạn 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "Ảnh tối đa 5MB" }, { status: 400 });
        }

        // Convert file → base64
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        const dataUri = `data:${file.type};base64,${base64}`;

        // Upload lên Cloudinary
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: "cv-avatars",
            transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" },
                { quality: "auto", fetch_format: "auto" },
            ],
        });

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