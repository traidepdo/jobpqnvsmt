import "dotenv/config";
import { prisma } from "../lib/prisma";
import { fixInvalidCompanySize } from "../lib/prismaSafe";

async function test() {
  console.log("Testing sequential queries...");
  try {
    console.log("1. Running fixInvalidCompanySize...");
    await fixInvalidCompanySize(prisma);
    console.log("Fix done.");
    
    console.log("2. Querying province...");
    const prov = await prisma.province.findFirst();
    console.log("Province:", prov);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
