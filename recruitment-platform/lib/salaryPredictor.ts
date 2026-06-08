import { prisma } from './prisma';

// Encode experience ordinal mapping
export function encodeExperience(exp: string | null | undefined): number {
  switch (exp) {
    case 'NO_EXPERIENCE': return 0;
    case 'UNDER_1_YEAR': return 1;
    case 'ONE_TO_THREE_YEARS': return 2;
    case 'THREE_TO_FIVE_YEARS': return 4;
    case 'OVER_FIVE_YEARS': return 6;
    default: return 0;
  }
}

// Encode level ordinal mapping
export function encodeLevel(lvl: string | null | undefined): number {
  switch (lvl) {
    case 'INTERN': return 0;
    case 'FRESHER': return 1;
    case 'JUNIOR': return 2;
    case 'MID': return 3.5;
    case 'SENIOR': return 5.5;
    case 'LEAD': return 7.5;
    case 'MANAGER': return 9.5;
    case 'DIRECTOR': return 12;
    default: return 1.5;
  }
}

// Solve Ridge Regression: (X_design^T * X_design + lambda * I) * w = X_design^T * y
// Gaussian elimination with pivoting is used to solve the linear system.
function solveRidgeRegression(X: number[][], y: number[], lambda = 0.5): { weights: number[], intercept: number } {
  const N = X.length;
  if (N === 0) return { weights: [], intercept: 0 };
  const M = X[0].length; // number of features (excluding intercept)

  const A: number[][] = Array(M + 1).fill(0).map(() => Array(M + 1).fill(0));
  const B: number[] = Array(M + 1).fill(0);

  for (let i = 0; i < N; i++) {
    const row = [1, ...X[i]];
    const yi = y[i];
    for (let j = 0; j <= M; j++) {
      B[j] += row[j] * yi;
      for (let k = 0; k <= M; k++) {
        A[j][k] += row[j] * row[k];
      }
    }
  }

  // Apply L2 regularization to features (excluding intercept A[0][0])
  for (let j = 1; j <= M; j++) {
    A[j][j] += lambda;
  }

  const w = solveLinearSystem(A, B);
  if (!w) {
    return { weights: Array(M).fill(0), intercept: B[0] / (N || 1) };
  }

  return {
    intercept: w[0],
    weights: w.slice(1)
  };
}

function solveLinearSystem(A: number[][], B: number[]): number[] | null {
  const n = B.length;
  const a = A.map(row => [...row]);
  const b = [...B];

  for (let i = 0; i < n; i++) {
    let maxEl = Math.abs(a[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(a[k][i]) > maxEl) {
        maxEl = Math.abs(a[k][i]);
        maxRow = k;
      }
    }

    const tempRow = a[maxRow];
    a[maxRow] = a[i];
    a[i] = tempRow;

    const tempVal = b[maxRow];
    b[maxRow] = b[i];
    b[i] = tempVal;

    if (Math.abs(a[i][i]) < 1e-12) {
      return null;
    }

    for (let k = i + 1; k < n; k++) {
      const c = -a[k][i] / a[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) {
          a[k][j] = 0;
        } else {
          a[k][j] += c * a[i][j];
        }
      }
      b[k] += c * b[i];
    }
  }

  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = b[i];
    for (let j = i + 1; j < n; j++) {
      sum -= a[i][j] * x[j];
    }
    x[i] = sum / a[i][i];
  }
  return x;
}

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
      experience: 1.5,
      level: 2.0,
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

  const uniqueTypes = Array.from(new Set(jobs.map(j => j.type).filter(Boolean)));
  const uniqueCategories = Array.from(new Set(jobs.map(j => j.categoryId).filter(Boolean)));
  const uniqueWards = Array.from(new Set(jobs.map(j => j.wardId).filter(Boolean)));

  const featureNames: string[] = [
    'experience',
    'level',
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

    row[0] = encodeExperience(job.experience);
    row[1] = encodeLevel(job.level);

    const typeIdx = featureNames.indexOf(`type_${job.type}`);
    if (typeIdx !== -1) row[typeIdx] = 1;

    const catIdx = featureNames.indexOf(`category_${job.categoryId}`);
    if (catIdx !== -1) row[catIdx] = 1;

    const wardIdx = featureNames.indexOf(`ward_${job.wardId}`);
    if (wardIdx !== -1) row[wardIdx] = 1;

    X.push(row);
    y.push(avgSalary);
  }

  const result = solveRidgeRegression(X, y);

  const weightsObj: Record<string, number> = {};
  for (let i = 0; i < featureNames.length; i++) {
    weightsObj[featureNames[i]] = result.weights[i] || 0;
  }

  await prisma.salaryModel.create({
    data: {
      weights: weightsObj,
      intercept: result.intercept,
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
      weights: { experience: 1.5, level: 2.0 },
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

  const expVal = encodeExperience(features.experience);
  prediction += (model.weights['experience'] ?? 0) * expVal;

  const lvlVal = encodeLevel(features.level);
  prediction += (model.weights['level'] ?? 0) * lvlVal;

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
