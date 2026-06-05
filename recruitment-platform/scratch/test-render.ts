import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { renderReactTemplate } from '../lib/renderResumeServer';

async function test() {
  try {
    const id = "cmq11zgm8000crckq16dgnl46";
    const resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, phone: true, avatar: true } },
        template: { select: { slug: true } },
      },
    });
    console.log("Resume found:", !!resume);
    if (resume) {
      const html = renderReactTemplate(
        resume.template?.slug || "classic",
        {
          name: resume.user.name,
          email: resume.user.email,
          phone: resume.user.phone || "",
          avatar: resume.avatarUrl || resume.user.avatar || "",
        },
        resume
      );
      console.log("SUCCESS! HTML length:", html.length);
    }
  } catch (err) {
    console.error("ERROR DETECTED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
