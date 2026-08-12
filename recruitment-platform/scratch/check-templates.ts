import "dotenv/config";
import { prisma } from "../lib/prisma";

async function run() {
  try {
    const templates = await prisma.resumeTemplate.findMany();
    console.log("TEMPLATES IN DB:", templates.map(t => ({ id: t.id, name: t.name, slug: t.slug, thumbnailUrl: t.thumbnailUrl })));
  } catch (error) {
    console.error("Error checking templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
