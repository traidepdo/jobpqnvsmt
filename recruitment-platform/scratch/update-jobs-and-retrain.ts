import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { trainSalaryModel } from '../lib/salaryPredictor';

async function main() {
  console.log('--- Step 1: Fast batch extending all job deadlines by 1 month ---');
  
  const count = await prisma.$executeRawUnsafe(
    `UPDATE jobs SET deadline = NOW() + INTERVAL '1 month', status = 'ACTIVE', "isVisible" = TRUE`
  );
  console.log(`Successfully extended deadline for ${count} jobs in Postgres.`);

  console.log('\n--- Step 2: Training per-category Regression Models ---');
  await trainSalaryModel();
  console.log('Successfully trained and saved separate Regression Models per Category!');

  const modelCount = await prisma.salaryModel.count();
  console.log(`Total SalaryModel records in database: ${modelCount}`);

  const sampleModels = await prisma.salaryModel.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, categoryId: true, intercept: true, createdAt: true }
  });
  console.log('Latest SalaryModel records:', sampleModels);

  process.exit(0);
}

main().catch((err) => {
  console.error('Error running script:', err);
  process.exit(1);
});
