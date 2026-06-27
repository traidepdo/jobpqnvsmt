import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyToken } from './auth';

export async function requireCandidate() {
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (payload.role !== 'CANDIDATE') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { payload };
}
