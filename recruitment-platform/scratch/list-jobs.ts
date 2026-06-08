import { prisma } from '../lib/prisma';

async function main() {
  const jobs = await prisma.job.findMany({
    select: {
      id: true,
      title: true,
      salaryMin: true,
      salaryMax: true,
    }
  });
  console.log("All Jobs with Salaries:", JSON.stringify(jobs, null, 2));
}

main().catch(console.error);
