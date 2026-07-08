import { prisma } from './prisma';
import { RidgeRegression, setBackend } from 'scikitjs';
import * as tf from '@tensorflow/tfjs';

// Set tensorflow backend for scikitjs
setBackend(tf);

export async function trainSalaryModel() {
  const jobs = await prisma.job.findMany({
    where: {
      salaryMin: { not: null },
      salaryMax: { not: null },
    },
    select: {
      salaryMin: true,
      salaryMax: true,
      experience: true,
      level: true,
      type: true,
      categoryId: true,
      wardId: true,
    }
  });

  // Seed default weights if there are too few jobs
  if (jobs.length < 5) {
    const defaultWeights = {
      experience_NO_EXPERIENCE: 0.0,
      experience_UNDER_1_YEAR: 1.5,
      experience_ONE_TO_THREE_YEARS: 3.0,
      experience_THREE_TO_FIVE_YEARS: 6.0,
      experience_OVER_FIVE_YEARS: 9.0,
      level_INTERN: 0.0,
      level_FRESHER: 1.5,
      level_JUNIOR: 3.0,
      level_MID: 5.0,
      level_SENIOR: 8.0,
      level_LEAD: 11.0,
      level_MANAGER: 14.0,
      level_DIRECTOR: 18.0,
      type_FULL_TIME: 2.0,
      type_PART_TIME: -3.0,
      type_INTERNSHIP: -5.0,
      type_REMOTE: 1.0,
      type_CONTRACT: 2.0,
    };
    await prisma.salaryModel.create({
      data: {
        weights: defaultWeights,
        intercept: 10.0,
      }
    });
    return;
  }

  const uniqueExperiences = Array.from(new Set(jobs.map(j => j.experience).filter(Boolean)));
  const uniqueLevels = Array.from(new Set(jobs.map(j => j.level).filter(Boolean)));
  const uniqueTypes = Array.from(new Set(jobs.map(j => j.type).filter(Boolean)));
  const uniqueCategories = Array.from(new Set(jobs.map(j => j.categoryId).filter(Boolean)));
  const uniqueWards = Array.from(new Set(jobs.map(j => j.wardId).filter(Boolean)));

  const featureNames: string[] = [
    ...uniqueExperiences.map(e => `experience_${e}`),
    ...uniqueLevels.map(l => `level_${l}`),
    ...uniqueTypes.map(t => `type_${t}`),
    ...uniqueCategories.map(c => `category_${c}`),
    ...uniqueWards.map(w => `ward_${w}`),
  ];

  const X: number[][] = [];
  const y: number[] = [];

  for (const job of jobs) {
    let avgSalary = ((job.salaryMin || 0) + (job.salaryMax || 0)) / 2;
    if (avgSalary > 100000) {
      avgSalary = avgSalary / 1000000;
    }
    // Outlier filter: ignore jobs with salaries greater than 100 million or less than 2 million
    if (avgSalary > 100 || avgSalary < 2) {
      continue;
    }
    const row = Array(featureNames.length).fill(0);

    const expIdx = featureNames.indexOf(`experience_${job.experience}`);
    if (expIdx !== -1) row[expIdx] = 1;

    const lvlIdx = featureNames.indexOf(`level_${job.level}`);
    if (lvlIdx !== -1) row[lvlIdx] = 1;

    const typeIdx = featureNames.indexOf(`type_${job.type}`);
    if (typeIdx !== -1) row[typeIdx] = 1;

    const catIdx = featureNames.indexOf(`category_${job.categoryId}`);
    if (catIdx !== -1) row[catIdx] = 1;

    const wardIdx = featureNames.indexOf(`ward_${job.wardId}`);
    if (wardIdx !== -1) row[wardIdx] = 1;

    X.push(row);
    y.push(avgSalary);
  }

  // Use scikitjs RidgeRegression
  const ridge = new RidgeRegression({ alpha: 0.5 });
  await ridge.fit(X, y);

  const coefArray = ridge.coef.arraySync() as number[];
  const interceptVal = ridge.intercept as number;

  const weightsObj: Record<string, number> = {};
  for (let i = 0; i < featureNames.length; i++) {
    weightsObj[featureNames[i]] = coefArray[i] || 0;
  }

  await prisma.salaryModel.create({
    data: {
      weights: weightsObj,
      intercept: interceptVal,
    }
  });
}

export async function getLatestModel(): Promise<{ weights: Record<string, number>; intercept: number }> {
  let model = await prisma.salaryModel.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!model) {
    await trainSalaryModel();
    model = await prisma.salaryModel.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  } else {
    const ageInMs = Date.now() - new Date(model.createdAt).getTime();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    if (ageInMs > sevenDaysInMs) {
      trainSalaryModel().catch(err => console.error("Error auto-training salary model:", err));
    }
  }

  if (!model) {
    return {
      weights: {
        experience_NO_EXPERIENCE: 0.0,
        experience_UNDER_1_YEAR: 1.5,
        experience_ONE_TO_THREE_YEARS: 3.0,
        experience_THREE_TO_FIVE_YEARS: 6.0,
        experience_OVER_FIVE_YEARS: 9.0,
        level_INTERN: 0.0,
        level_FRESHER: 1.5,
        level_JUNIOR: 3.0,
        level_MID: 5.0,
        level_SENIOR: 8.0,
        level_LEAD: 11.0,
        level_MANAGER: 14.0,
        level_DIRECTOR: 18.0,
      },
      intercept: 10.0
    };
  }

  return {
    weights: model.weights as Record<string, number>,
    intercept: model.intercept,
  };
}

export function predictSalary(
  features: {
    experience?: string | null;
    level?: string | null;
    type?: string | null;
    categoryId?: string | null;
    wardId?: string | null;
  },
  model: { weights: Record<string, number>; intercept: number }
): number {
  let prediction = model.intercept;

  if (features.experience) {
    prediction += model.weights[`experience_${features.experience}`] ?? 0;
  }

  if (features.level) {
    prediction += model.weights[`level_${features.level}`] ?? 0;
  }

  if (features.type) {
    prediction += model.weights[`type_${features.type}`] ?? 0;
  }

  if (features.categoryId) {
    prediction += model.weights[`category_${features.categoryId}`] ?? 0;
  }

  if (features.wardId) {
    prediction += model.weights[`ward_${features.wardId}`] ?? 0;
  }

  return Math.max(1, prediction); // Default minimum predicted salary of 1M VND
}
