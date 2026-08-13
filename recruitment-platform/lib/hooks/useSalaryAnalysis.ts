import { predictSalary } from '@/lib/salaryPredictor';

export interface SalaryAnalysisResult {
  predictedSalary: number;
  actualSalary: number | null;
  status: 'good' | 'average' | 'bad';
  percentageDiff: number;
  comparisonMessage: string;
}

export function useSalaryAnalysis(
  job: {
    experience: string | null;
    level: string | null;
    type: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
  },
  categoryId: string | null,
  wardId: string | null,
  model: { weights: Record<string, number>; intercept: number }
): SalaryAnalysisResult | null {
  try {
    const predictedSalary = predictSalary({
      experience: job.experience,
      level: job.level,
      type: job.type,
      categoryId,
      wardId
    }, model);

    const min = job.salaryMin;
    const max = job.salaryMax;

    let actualSalary: number | null = null;
    if (min !== null && max !== null) {
      actualSalary = (min + max) / 2;
    } else if (min !== null) {
      actualSalary = min;
    } else if (max !== null) {
      actualSalary = max;
    }

    let status: 'good' | 'average' | 'bad' = 'average';
    let percentageDiff = 0;
    let comparisonMessage = 'Mức lương cạnh tranh, tương đương với mặt bằng chung thị trường.';

    if (actualSalary !== null) {
      let actualSalaryScaled = actualSalary;
      if (actualSalaryScaled > 100000) {
        actualSalaryScaled = actualSalaryScaled / 1000000;
      }
      percentageDiff = Math.round(((actualSalaryScaled - predictedSalary) / predictedSalary) * 100);

      if (actualSalaryScaled >= 1.15 * predictedSalary) {
        status = 'good';
        comparisonMessage = `Mức lương này rất tốt so với thị trường (Cao hơn khoảng ${Math.abs(percentageDiff)}% so với vị trí tương tự).`;
      } else if (actualSalaryScaled < 0.9 * predictedSalary) {
        status = 'bad';
        comparisonMessage = `Mức lương này thấp hơn mức trung bình của thị trường (Thấp hơn khoảng ${Math.abs(percentageDiff)}% so với vị trí tương tự).`;
      } else {
        status = 'average';
        comparisonMessage = `Mức lương cạnh tranh, ngang bằng với mặt bằng chung thị trường (Chênh lệch khoảng ${percentageDiff}%).`;
      }
    }

    return {
      predictedSalary: Math.round(predictedSalary * 10) / 10,
      actualSalary,
      status,
      percentageDiff,
      comparisonMessage,
    };
  } catch (err) {
    console.error("Error computing salary analysis:", err);
    return null;
  }
}
