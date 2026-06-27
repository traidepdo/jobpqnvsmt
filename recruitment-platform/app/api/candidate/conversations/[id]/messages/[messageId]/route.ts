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

  const { messageId } = await params;

  // Find the message and verify it was sent by this user
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      senderId: user.id as string
    }
  });

  if (!message) {
    return NextResponse.json({ error: "Không tìm thấy tin nhắn hoặc bạn không có quyền xóa" }, { status: 404 });
  }

  try {
    await prisma.message.delete({
      where: { id: messageId }
    });
    return NextResponse.json({ success: true, message: "Đã xóa tin nhắn thành công" });
  } catch (error: any) {
    console.error("Delete message error:", error);
    return NextResponse.json({ error: "Không thể xóa tin nhắn" }, { status: 500 });
  }
}
