import { NextRequest, NextResponse } from "next/server";
import { requireCandidate } from "@/lib/requireCandidate";
import { prisma } from "@/lib/prisma";

/**
 * 1. LẤY DANH SÁCH CÔNG TY ĐÃ THEO DÕI
 * GET /api/candidate/follow-employer
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireCandidate();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    // Xây dựng điều kiện lọc động
    const whereClause: any = {
      userId: auth.payload.id,
    };

    // Nếu truyền cụ thể companyId (dùng khi muốn check xem Candidate đã follow công ty này chưa)
    if (companyId) {
      whereClause.companyId = companyId;
    }

    const follows = await prisma.savedCompany.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true, // Thêm slug để đồng bộ với cấu trúc định hướng trang chi tiết
            logo: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, follows });
  } catch (error) {
    console.error("Lỗi GET follow-employer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * 2. HỦY THEO DÕI CÔNG TY (Xử lý cho nút "Bỏ theo dõi" ở Frontend)
 * DELETE /api/candidate/follow-employer?companyId=...
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireCandidate();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ error: "Thiếu dữ liệu companyId" }, { status: 400 });
    }

    // Thực hiện xóa bản ghi tương ứng dựa trên cặp khóa duy nhất (userId, companyId)
    await prisma.savedCompany.delete({
      where: {
        userId_companyId: {
          userId: auth.payload.id,
          companyId: companyId,
        },
      },
    });

    return NextResponse.json({ ok: true, message: "Đã bỏ theo dõi công ty thành công" });
  } catch (error: any) {
    console.error("Lỗi DELETE follow-employer:", error);

    // Trường hợp bản ghi không tồn tại hoặc đã xóa trước đó
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Bản ghi không tồn tại hoặc đã được xóa" }, { status: 404 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}