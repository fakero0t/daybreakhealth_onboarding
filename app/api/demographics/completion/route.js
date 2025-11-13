/**
 * Demographics Completion State API Route
 * 
 * GET /api/demographics/completion?patientId={id} - Get completion state
 */

import { NextResponse } from 'next/server';
import { getCompletionState } from '@/lib/services/demographics-service';

/**
 * GET /api/demographics/completion?patientId={id}
 * Get completion state for a patient's demographics
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId query parameter is required' },
        { status: 400 }
      );
    }

    // TODO: Add authentication check
    // const userId = await getUserIdFromSession(request);
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // TODO: Add authorization check
    // if (!canAccessPatientData(userId, patientId)) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const completionState = await getCompletionState(patientId);

    return NextResponse.json(completionState, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/demographics/completion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

