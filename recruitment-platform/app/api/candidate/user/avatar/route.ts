import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { requireCandidate } from '@/lib/requireCandidate';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'candidate');

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

    // 5. Ensure upload dir exists
    if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // 6. Build unique filename: {userId}_{timestamp}.{ext}
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filename = `${auth.payload.id}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // 7. Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // 8. Public URL to store in DB
    const avatarUrl = `/candidate/${filename}`;

    // 9. Update DB
    await prisma.user.update({
        where: { id: auth.payload.id },
        data: { avatar: avatarUrl },
    });

    return NextResponse.json(
        { message: 'Cập nhật ảnh đại diện thành công.', avatarUrl },
        { status: 200 }
    );
}