import { NextResponse } from 'next/server';
import { trainSalaryModel } from '@/lib/salaryPredictor';

export async function POST() {
  try {
    await trainSalaryModel();
    return NextResponse.json({ success: true, message: 'Model trained successfully.' });
  } catch (error: any) {
    console.error('Error training salary model manually:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
