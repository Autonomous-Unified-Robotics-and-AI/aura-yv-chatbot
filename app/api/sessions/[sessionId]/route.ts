import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get session status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Find session in database
    const session = await prisma.userSession.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Calculate missing required fields
    const requiredFields = ['userName', 'userRole', 'schoolAffiliation', 'ventureStage', 'primaryNeed', 'urgencyLevel'];
    const missingFields = requiredFields.filter(field => 
      !session[field as keyof typeof session] && 
      !session[`extracted${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof typeof session]
    );

    return NextResponse.json({
      session_id: session.sessionId,
      phase: session.phase,
      completion_rate: session.completionRate,
      database_fields: {
        user_name: session.userName || session.extractedName,
        user_email: session.userEmail || session.extractedEmail,
        user_role: session.userRole || session.extractedRole,
        school_affiliation: session.schoolAffiliation,
        venture_stage: session.ventureStage,
        primary_need: session.primaryNeed,
        urgency_level: session.urgencyLevel,
        department: session.department || session.extractedDept,
        startup_stage: session.startupStage,
      },
      missing_required: missingFields,
      created_at: session.createdAt.toISOString(),
      last_activity: session.lastActivity.toISOString(),
      message_count: session.messages.length
    });

  } catch (error) {
    console.error('Session get error:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}