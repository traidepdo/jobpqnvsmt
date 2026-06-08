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

  // Verify group exists and belongs to this employer
  const group = await prisma.groupConversation.findFirst({
    where: { id, employerId: userId }
  });

  if (!group) {
    return NextResponse.json({ error: "Không tìm thấy nhóm trò chuyện hoặc bạn không có quyền xóa" }, { status: 404 });
  }

  try {
    // Delete all group messages and members associated with the group, then delete the group itself
    await prisma.$transaction([
      prisma.groupMessage.deleteMany({ where: { groupId: id } }),
      prisma.groupMember.deleteMany({ where: { groupId: id } }),
      prisma.groupConversation.delete({ where: { id } })
    ]);

    return NextResponse.json({ success: true, message: "Đã xóa nhóm trò chuyện thành công" });
  } catch (error: any) {
    console.error("Delete group error:", error);
    return NextResponse.json({ error: "Không thể xóa nhóm trò chuyện" }, { status: 500 });
  }
}
