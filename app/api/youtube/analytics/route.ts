import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSummary } from '@/lib/upload-analytics';
import { getAuthUser } from '@/lib/auth-util';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const summary = await getAnalyticsSummary();
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[analytics] Error fetching analytics:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
