import { prisma } from '../lib/prisma';
import { getLatestModel, predictSalary } from '../lib/salaryPredictor';

async function main() {
  const model = await prisma.salaryModel.findFirst({
    orderBy: { createdAt: 'desc' },
  });
  console.log("Latest Model in DB:", JSON.stringify(model, null, 2));

  const loadedModel = await getLatestModel();
  const testPred = predictSalary({
    experience: 'ONE_TO_THREE_YEARS',
    level: 'JUNIOR',
    type: 'FULL_TIME',
  }, loadedModel);
  console.log("Test Prediction:", testPred);
}

main().catch(console.error);
