import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  console.log('=== USER DATA SYNC API START ===');
  
  try {
    const body = await request.json();
    const { session_id, extracted_data, backend_session_data } = body;

    console.log('Sync request:', {
      session_id,
      has_extracted_data: !!extracted_data,
      has_backend_data: !!backend_session_data,
      extracted_fields: extracted_data ? Object.keys(extracted_data) : []
    });

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    // Find the session in the frontend database
    const session = await prisma.userSession.findUnique({
      where: { sessionId: session_id }
    });

    if (!session) {
      // If session doesn't exist in frontend DB, create it with backend data
      console.log('Session not found locally, creating from backend data');
      
      if (!backend_session_data) {
        return NextResponse.json(
          { error: 'Session not found and no backend_session_data provided' },
          { status: 404 }
        );
      }

      const newSession = await prisma.userSession.create({
        data: {
          sessionId: session_id,
          phase: backend_session_data.phase || 'welcome_data_collection',
          completionRate: backend_session_data.completion_rate || 0.0,
          // Map backend extracted data to frontend schema
          userName: extracted_data?.name || backend_session_data.database_fields?.user_name,
          userEmail: extracted_data?.email || backend_session_data.database_fields?.user_email,
          userRole: mapUserRole(extracted_data?.role || backend_session_data.database_fields?.user_role),
          schoolAffiliation: mapSchoolAffiliation(extracted_data?.school_affiliation || backend_session_data.database_fields?.school_affiliation),
          ventureStage: mapVentureStage(extracted_data?.startup_stage || backend_session_data.database_fields?.venture_stage),
          primaryNeed: backend_session_data.database_fields?.primary_need,
          urgencyLevel: backend_session_data.database_fields?.urgency_level,
          department: extracted_data?.department || backend_session_data.database_fields?.department,
          startupStage: extracted_data?.startup_stage || backend_session_data.database_fields?.startup_stage
        }
      });

      console.log('Created new session with extracted data:', newSession.sessionId);
      
      return NextResponse.json({
        status: 'created',
        session_id,
        message: 'Session created with extracted user data',
        extracted_fields: extracted_data ? Object.keys(extracted_data) : [],
        database_session_id: newSession.id
      });
    }

    // Session exists, update it with extracted data
    const updateData: any = {};

    if (extracted_data) {
      // Map extracted data to database fields
      if (extracted_data.name) {
        updateData.userName = extracted_data.name;
      }
      if (extracted_data.email) {
        updateData.userEmail = extracted_data.email;
      }
      if (extracted_data.role) {
        updateData.userRole = mapUserRole(extracted_data.role);
      }
      if (extracted_data.school_affiliation) {
        updateData.schoolAffiliation = mapSchoolAffiliation(extracted_data.school_affiliation);
      }
      if (extracted_data.department) {
        updateData.department = extracted_data.department;
      }
      if (extracted_data.startup_stage) {
        updateData.startupStage = extracted_data.startup_stage;
        updateData.ventureStage = mapVentureStage(extracted_data.startup_stage);
      }
    }

    // Also sync backend session data if provided
    if (backend_session_data) {
      updateData.phase = backend_session_data.phase || session.phase;
      updateData.completionRate = backend_session_data.completion_rate ?? session.completionRate;
      
      // Sync any additional backend fields that weren't extracted
      const backendFields = backend_session_data.database_fields || {};
      if (backendFields.primary_need && !updateData.primaryNeed) {
        updateData.primaryNeed = backendFields.primary_need;
      }
      if (backendFields.urgency_level && !updateData.urgencyLevel) {
        updateData.urgencyLevel = backendFields.urgency_level;
      }
    }

    // Only update if we have data to update
    if (Object.keys(updateData).length > 0) {
      const updatedSession = await prisma.userSession.update({
        where: { sessionId: session_id },
        data: updateData
      });

      console.log('Updated session with extracted data:', {
        session_id,
        updated_fields: Object.keys(updateData),
        values: updateData
      });

      return NextResponse.json({
        status: 'updated',
        session_id,
        message: 'Session updated with extracted user data',
        updated_fields: Object.keys(updateData),
        extracted_fields: extracted_data ? Object.keys(extracted_data) : []
      });
    } else {
      console.log('No data to update for session:', session_id);
      
      return NextResponse.json({
        status: 'no_changes',
        session_id,
        message: 'No new data to sync'
      });
    }

  } catch (error) {
    console.error('=== USER DATA SYNC ERROR ===');
    console.error('Sync error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to sync user data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions to map backend values to frontend schema values
function mapUserRole(role: string | null | undefined): string | null {
  if (!role) return null;
  
  const roleMap: { [key: string]: string } = {
    'student': 'student_undergrad', // Default to undergrad, can be refined later
    'faculty': 'faculty',
    'professor': 'faculty',
    'entrepreneur': 'external',
    'founder': 'external'
  };
  
  return roleMap[role.toLowerCase()] || role;
}

function mapSchoolAffiliation(school: string | null | undefined): string | null {
  if (!school) return null;
  
  const schoolMap: { [key: string]: string } = {
    'art': 'art',
    'engineering': 'seas',
    'seas': 'seas',
    'medicine': 'med',
    'med': 'med',
    'business': 'som',
    'som': 'som',
    'law': 'law',
    'sciences': 'gsas',
    'nursing': 'nursing',
    'music': 'music',
    'drama': 'drama'
  };
  
  return schoolMap[school.toLowerCase()] || school;
}

function mapVentureStage(stage: string | null | undefined): string | null {
  if (!stage) return null;
  
  const stageMap: { [key: string]: string } = {
    'idea': 'idea',
    'prototype': 'prototype',
    'mvp': 'pilot',
    'pilot': 'pilot',
    'early': 'scaling',
    'seed': 'scaling',
    'series a': 'established',
    'growth': 'established'
  };
  
  return stageMap[stage.toLowerCase()] || stage;
}

export async function GET() {
  // Health check for sync endpoint
  return NextResponse.json({
    status: 'ok',
    service: 'user-data-sync',
    timestamp: new Date().toISOString()
  });
}