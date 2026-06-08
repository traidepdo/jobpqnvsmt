import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEmployer } from "@/lib/requireEmployer";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const auth = await requireEmployer();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const userId = auth.payload.id as string;
  const { messageId } = await params;

  // Find the group message and verify it was sent by this user
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
    console.error("Delete group message error:", error);
    return NextResponse.json({ error: "Không thể xóa tin nhắn" }, { status: 500 });
  }
}
