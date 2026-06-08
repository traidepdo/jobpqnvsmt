import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEmployer } from "@/lib/requireEmployer";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireEmployer();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

  const userId = auth.payload.id as string;
  const { id } = await params;

  // Verify conversation exists and belongs to this employer
  const conv = await prisma.conversation.findFirst({
    where: { id, employerId: userId }
  });

  if (!conv) {
    return NextResponse.json({ error: "Không tìm thấy cuộc hội thoại" }, { status: 404 });
  }

  try {
    // Delete all messages associated with the conversation, then delete the conversation itself
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { conversationId: id } }),
      prisma.conversation.delete({ where: { id } })
    ]);

    return NextResponse.json({ success: true, message: "Đã xóa cuộc hội thoại thành công" });
  } catch (error: any) {
    console.error("Delete conversation error:", error);
    return NextResponse.json({ error: "Không thể xóa cuộc hội thoại" }, { status: 500 });
  }
}
