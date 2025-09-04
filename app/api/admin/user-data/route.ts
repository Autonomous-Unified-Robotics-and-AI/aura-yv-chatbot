import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET endpoint to retrieve user data for admin
export async function GET(request: NextRequest) {
  try {
    // Check for admin token (basic check)
    const authorization = request.headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all user sessions with messages
    const sessions = await prisma.userSession.findMany({
      include: {
        messages: {
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100 sessions
    });

    // Transform data to match expected format
    const transformedSessions = sessions.map(session => ({
      session_id: session.sessionId,
      created_at: session.createdAt.toISOString(),
      last_activity: session.lastActivity.toISOString(),
      phase: session.phase,
      completion_rate: session.completionRate,
      messages: session.messages.map(msg => ({
        timestamp: msg.timestamp.toISOString(),
        user_message: msg.userMessage || '',
        bot_response: msg.aiResponse || '',
        phase: msg.phase || session.phase
      })),
      collected_data: {
        name: session.userName || session.extractedName,
        email: session.userEmail || session.extractedEmail,
        role: session.userRole || session.extractedRole,
        department: session.department || session.extractedDept,
        startup_stage: session.startupStage,
        school_affiliation: session.schoolAffiliation,
        venture_stage: session.ventureStage,
        primary_need: session.primaryNeed,
        urgency_level: session.urgencyLevel
      }
    }));

    const uniqueUsers = new Set();
    transformedSessions.forEach(session => {
      const email = session.collected_data.email;
      const identifier = email || `anon_${session.session_id}`;
      uniqueUsers.add(identifier);
    });

    return NextResponse.json({
      total_sessions: transformedSessions.length,
      total_users: uniqueUsers.size,
      data: transformedSessions
    });

  } catch (error) {
    console.error('Error retrieving user data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve user data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}