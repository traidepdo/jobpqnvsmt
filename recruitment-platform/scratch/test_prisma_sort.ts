import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: "ACTIVE" },
      orderBy: {
        salaryMin: { sort: "asc", nulls: "last" }
      },
      take: 5,
      select: { id: true, salaryMin: true }
    });
    console.log("Success! Jobs:", jobs);
  } catch (error) {
    console.error("Error running Prisma sort query:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
