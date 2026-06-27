import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id as string;
  const { messageId } = await params;

  // Find the group message and verify it was sent by this candidate
  const msg = await prisma.groupMessage.findFirst({
    where: {
      id: messageId,
      senderId: userId
    }
  });

  if (!msg) {
    return NextResponse.json({ error: "Không tìm thấy tin nhắn hoặc bạn không có quyền xóa" }, { status: 404 });
  }

  try {
    await prisma.groupMessage.delete({
      where: { id: messageId }
    });
    return NextResponse.json({ success: true, message: "Đã xóa tin nhắn thành công" });
  } catch (error: any) {
    console.error("Delete candidate group message error:", error);
    return NextResponse.json({ error: "Không thể xóa tin nhắn" }, { status: 500 });
  }
}
