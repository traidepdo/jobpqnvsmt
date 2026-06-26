import { prisma } from '@/lib/prisma';

export async function cancelApplication(id: string) {
    try {
        const res = await fetch(`/api/candidate/applications?id=${id}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            return { success: true };
        } else {
            const err = await res.json().catch(() => ({}));
            return { error: err.error || 'Không thể hủy ứng tuyển. Vui lòng thử lại.' };
        }
    } catch (e) {
        console.error(e);
        return { error: 'Đã xảy ra lỗi khi hủy ứng tuyển.' };
    }
}
export async function getApplication(id: string) {
    const applications = await prisma.application.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        include: {
            job: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    salaryMin: true,
                    salaryMax: true,
                    company: { select: { name: true, logo: true } },
                    category: { select: { name: true } },
                },
            },
            resume: { select: { id: true, title: true } },
        },
    });
    return applications;
}