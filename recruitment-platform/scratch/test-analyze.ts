import { getLatestModel, predictSalary } from '../lib/salaryPredictor';

async function main() {
  try {
    const experience = "NO_EXPERIENCE";
    const level = "INTERN";
    const type = "FULL_TIME";
    const categoryId = "hotel";
    const wardId = "duong-dong";
    const salaryMin = 5000000;
    const salaryMax = 8000000;

    const model = await getLatestModel();
    const predictedSalary = predictSalary({ experience, level, type, categoryId, wardId }, model);
    console.log("Predicted:", predictedSalary);

    let actualSalary = (salaryMin + salaryMax) / 2;
    if (actualSalary > 100000) {
      actualSalary = actualSalary / 1000000;
    }
    console.log("Actual:", actualSalary);

    const percentageDiff = Math.round(((actualSalary - predictedSalary) / predictedSalary) * 100);
    console.log("Diff:", percentageDiff);
  } catch (err) {
    console.error("CRASH ERROR:", err);
  }
}

main().catch(console.error);
