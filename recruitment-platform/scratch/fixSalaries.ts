import { prisma } from '../lib/prisma';

async function main() {
  const smallJobs = await prisma.job.findMany({
    where: {
      OR: [
        { salaryMin: { lt: 100000, not: null } },
        { salaryMax: { lt: 100000, not: null } }
      ]
    },
    select: {
      id: true,
      salaryMin: true,
      salaryMax: true,
      title: true
    }
  });

  console.log('Found small jobs:', smallJobs.length);

  for (const job of smallJobs) {
    const updatedMin = job.salaryMin !== null && job.salaryMin < 100000 ? job.salaryMin * 1000000 : job.salaryMin;
    const updatedMax = job.salaryMax !== null && job.salaryMax < 100000 ? job.salaryMax * 1000000 : job.salaryMax;

    await prisma.job.update({
      where: { id: job.id },
      data: {
        salaryMin: updatedMin,
        salaryMax: updatedMax
      }
    });

    console.log(`Updated "${job.title}": Min ${job.salaryMin} -> ${updatedMin}, Max ${job.salaryMax} -> ${updatedMax}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
