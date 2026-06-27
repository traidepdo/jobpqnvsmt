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
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id as string;
  const { id } = await params;

  // Verify conversation exists and belongs to this candidate
  const conv = await prisma.conversation.findFirst({
    where: { id, candidateId: userId }
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
