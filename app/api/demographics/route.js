/**
 * Demographics API Routes
 * 
 * POST   /api/demographics - Create demographics record
 * GET    /api/demographics?patientId={id} - Get demographics record
 * PUT    /api/demographics?patientId={id} - Full update of demographics
 * PATCH  /api/demographics?patientId={id} - Partial update (auto-save)
 */

import { NextResponse } from 'next/server';
import {
  createDemographics,
  getDemographics,
  updateDemographics,
  ValidationError,
  NotFoundError,
  DatabaseError
} from '@/lib/services/demographics-service';

/**
 * GET /api/demographics?patientId={id}
 * Retrieve demographics record for a patient
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

    const demographics = await getDemographics(patientId);

    if (!demographics) {
      return NextResponse.json(
        { error: 'Demographics record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(demographics, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/demographics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/demographics
 * Create a new demographics record
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { patientId, data } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId is required' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'data is required' },
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

    // For now, use patientId as userId (in real implementation, get from session)
    const userId = patientId;

    const demographics = await createDemographics(patientId, data, userId);

    return NextResponse.json(demographics, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: 400 }
      );
    }

    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    console.error('Error in POST /api/demographics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/demographics?patientId={id}
 * Full update of demographics record
 */
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId query parameter is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'data is required' },
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

    // For now, use patientId as userId (in real implementation, get from session)
    const userId = patientId;

    const demographics = await updateDemographics(patientId, data, false, userId);

    return NextResponse.json(demographics, { status: 200 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error('Error in PUT /api/demographics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/demographics?patientId={id}
 * Partial update of demographics record (for auto-save)
 */
export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId query parameter is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'data is required' },
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

    // For now, use patientId as userId (in real implementation, get from session)
    const userId = patientId;

    const demographics = await updateDemographics(patientId, data, true, userId);

    return NextResponse.json(demographics, { status: 200 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, errors: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error('Error in PATCH /api/demographics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

