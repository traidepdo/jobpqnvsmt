import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Next.js 15 yêu cầu khai báo params dưới dạng Promise
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Giải nén (unwrap) params bằng await
        const resolvedParams = await params;
        const companyId = resolvedParams.id;

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: {
                ward: {
                    include: {
                        district: {
                            include: { province: true }
                        }
                    }
                },
                jobs: {
                    where: { status: "ACTIVE" }, // Chỉ lấy tin tuyển dụng đang hoạt động
                    orderBy: { createdAt: "desc" },
                    include: {
                        // FIX: Đồng bộ chuẩn tên quan hệ jobCategory theo Schema Prisma của bạn
                        category: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        if (!company) {
            return NextResponse.json(
                { ok: false, error: "Không tìm thấy công ty" },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true, company });
    } catch (error: any) {
        console.error("Lỗi chí mạng API Detail Company:", error);
        // Ép kiểu JSON trả về để tránh lỗi sập giao diện HTML (<!DOCTYPE html>) ở frontend
        return NextResponse.json(
            { ok: false, error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}