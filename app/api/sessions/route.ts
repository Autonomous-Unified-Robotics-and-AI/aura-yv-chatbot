import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Create new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_agent, initial_context } = body;

    // Generate a session ID
    const sessionId = `sess_${Math.random().toString(36).substring(2, 15)}`;

    // Create session in database
    const session = await prisma.userSession.create({
      data: {
        sessionId,
        phase: 'welcome_data_collection',
        completionRate: 0.0,
      },
    });

    // Set cookie and return response
    const response = NextResponse.json({
      session_id: session.sessionId,
      status: 'created',
      created_at: session.createdAt.toISOString(),
      phase: 'welcome_data_collection',
      completion_rate: 0.0
    });

    // Set session cookie
    response.cookies.set('yv_session_id', session.sessionId, {
      maxAge: 86400, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}