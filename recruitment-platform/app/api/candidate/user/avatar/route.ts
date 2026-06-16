import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCandidate } from '@/lib/requireCandidate';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
    // 1. Auth
    const auth = await requireCandidate();
    if (auth.error) return auth.error;

    // 2. Parse form data
    let formData: FormData;
    try {
        formData = await req.formData();
    } catch {
        return NextResponse.json({ message: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    }

    const file = formData.get('avatar');
    if (!file || !(file instanceof File)) {
        return NextResponse.json({ message: 'Không tìm thấy file ảnh.' }, { status: 400 });
    }

    // 3. Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
            { message: 'Chỉ chấp nhận file JPG, PNG, WEBP hoặc GIF.' },
            { status: 422 }
        );
    }

    // 4. Validate size
    if (file.size > MAX_SIZE_BYTES) {
        return NextResponse.json(
            { message: 'Kích thước ảnh không được vượt quá 5MB.' },
            { status: 422 }
        );
    }

    try {
        // 5. Convert file → base64 data URI
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        // 6. Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: 'candidate-avatars',
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' },
            ],
        });

        const avatarUrl = result.secure_url;

        // 7. Update DB
        await prisma.user.update({
            where: { id: auth.payload.id },
            data: { avatar: avatarUrl },
        });

        return NextResponse.json(
            { message: 'Cập nhật ảnh đại diện thành công.', avatarUrl },
            { status: 200 }
        );
    } catch (error) {
        console.error("Cloudinary upload avatar error:", error);
        return NextResponse.json({ message: 'Upload ảnh đại diện thất bại' }, { status: 500 });
    }
}