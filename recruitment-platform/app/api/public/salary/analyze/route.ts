import { NextResponse } from 'next/server';
import { getLatestModel, predictSalary } from '@/lib/salaryPredictor';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { experience, level, type, categoryId, wardId, salaryMin, salaryMax } = body;

    const model = await getLatestModel();
    const predictedSalary = predictSalary({ experience, level, type, categoryId, wardId }, model);

    const min = salaryMin ? parseFloat(salaryMin) : null;
    const max = salaryMax ? parseFloat(salaryMax) : null;

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
      if (actualSalary > 100000) {
        actualSalary = actualSalary / 1000000;
      }
      percentageDiff = Math.round(((actualSalary - predictedSalary) / predictedSalary) * 100);

      if (actualSalary >= 1.15 * predictedSalary) {
        status = 'good';
        comparisonMessage = `Mức lương này rất tốt so với thị trường (Cao hơn khoảng ${Math.abs(percentageDiff)}% so với vị trí tương tự).`;
      } else if (actualSalary < 0.9 * predictedSalary) {
        status = 'bad';
        comparisonMessage = `Mức lương này thấp hơn mức trung bình của thị trường (Thấp hơn khoảng ${Math.abs(percentageDiff)}% so với vị trí tương tự).`;
      } else {
        status = 'average';
        comparisonMessage = `Mức lương cạnh tranh, ngang bằng với mặt bằng chung thị trường (Chênh lệch khoảng ${percentageDiff}%).`;
      }
    }

    return NextResponse.json({
      predictedSalary: Math.round(predictedSalary * 10) / 10,
      actualSalary,
      status,
      percentageDiff,
      comparisonMessage,
    });
  } catch (error) {
    console.error('Error in salary analyze API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
