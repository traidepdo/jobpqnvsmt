import { prisma } from '../lib/prisma';

async function main() {
  const jobs = await prisma.job.findMany({
    select: {
      id: true,
      title: true,
      salaryMin: true,
      salaryMax: true
    }
  });

  const smallMin = jobs.filter(j => j.salaryMin !== null && j.salaryMin < 100000);
  const largeMin = jobs.filter(j => j.salaryMin !== null && j.salaryMin >= 100000);

  console.log('Jobs count:', jobs.length);
  console.log('Jobs with salaryMin < 100,000:', smallMin.length);
  if (smallMin.length > 0) {
    console.log('Sample small salaries:', smallMin.slice(0, 5));
  }
  console.log('Jobs with salaryMin >= 100,000:', largeMin.length);
  if (largeMin.length > 0) {
    console.log('Sample large salaries:', largeMin.slice(0, 5));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
