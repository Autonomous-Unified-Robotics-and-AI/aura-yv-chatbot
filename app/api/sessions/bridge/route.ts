import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  console.log('=== SESSION BRIDGE API START ===');
  
  try {
    const body = await request.json();
    const { session_id, backend_session_data } = body;

    console.log('Bridge request:', { session_id, has_backend_data: !!backend_session_data });

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    // Check if session exists locally
    const existingSession = await prisma.userSession.findUnique({
      where: { sessionId: session_id }
    });

    if (existingSession) {
      console.log('Session already exists locally:', session_id);
      return NextResponse.json({
        status: 'exists',
        session_id,
        message: 'Session already synced'
      });
    }

    // If we have backend session data, create local session to maintain sync
    if (backend_session_data) {
      console.log('Creating local session from backend data:', session_id);
      
      const localSession = await prisma.userSession.create({
        data: {
          sessionId: session_id,
          phase: backend_session_data.phase || 'welcome_data_collection',
          completionRate: backend_session_data.completion_rate || 0.0,
          // Map any other fields from backend data as needed
          userName: backend_session_data.database_fields?.user_name,
          userEmail: backend_session_data.database_fields?.user_email,
          userRole: backend_session_data.database_fields?.user_role,
          schoolAffiliation: backend_session_data.database_fields?.school_affiliation,
          ventureStage: backend_session_data.database_fields?.venture_stage,
          primaryNeed: backend_session_data.database_fields?.primary_need,
          urgencyLevel: backend_session_data.database_fields?.urgency_level,
          department: backend_session_data.database_fields?.department,
          startupStage: backend_session_data.database_fields?.startup_stage
        }
      });

      console.log('Local session created:', localSession.sessionId);
      
      return NextResponse.json({
        status: 'synced',
        session_id,
        local_session_id: localSession.sessionId,
        message: 'Session synced to local database'
      });
    }

    // If no backend data provided, just acknowledge the session exists in backend
    console.log('Session exists in backend but not locally:', session_id);
    return NextResponse.json({
      status: 'backend_only',
      session_id,
      message: 'Session exists in backend but not locally'
    });

  } catch (error) {
    console.error('=== SESSION BRIDGE ERROR ===');
    console.error('Bridge error:', error);
    
    return NextResponse.json(
      { 
        error: 'Session bridge failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check for bridge
  return NextResponse.json({
    status: 'ok',
    service: 'session-bridge',
    timestamp: new Date().toISOString()
  });
}