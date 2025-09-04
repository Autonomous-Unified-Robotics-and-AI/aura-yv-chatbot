import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET endpoint to retrieve stats for admin
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

    // Get session counts
    const totalSessions = await prisma.userSession.count();
    
    // Get active sessions (last activity within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const activeSessions = await prisma.userSession.count({
      where: {
        lastActivity: {
          gte: oneHourAgo
        }
      }
    });

    // Get total messages
    const totalMessages = await prisma.chatMessage.count();

    // Get sessions with data collection
    const sessionsWithData = await prisma.userSession.count({
      where: {
        OR: [
          { userName: { not: null } },
          { userEmail: { not: null } },
          { extractedName: { not: null } },
          { extractedEmail: { not: null } }
        ]
      }
    });

    const dataCollectionRate = totalSessions > 0 ? sessionsWithData / totalSessions : 0;

    // Analyze top user needs from messages (simple keyword analysis)
    const messages = await prisma.chatMessage.findMany({
      where: {
        userMessage: { not: null }
      },
      select: {
        userMessage: true
      },
      take: 1000 // Analyze recent 1000 messages
    });

    const needKeywords: Record<string, number> = {};
    const keywordsToTrack = ['funding', 'patent', 'mentor', 'accelerator', 'legal', 'ip', 'investment', 'startup'];

    messages.forEach(message => {
      const userMsg = (message.userMessage || '').toLowerCase();
      keywordsToTrack.forEach(keyword => {
        if (userMsg.includes(keyword)) {
          needKeywords[keyword] = (needKeywords[keyword] || 0) + 1;
        }
      });
    });

    const topNeeds = Object.entries(needKeywords)
      .map(([need, count]) => ({ need, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      total_sessions: totalSessions,
      active_sessions: activeSessions,
      total_messages: totalMessages,
      data_collection_rate: Math.round(dataCollectionRate * 1000) / 1000,
      top_user_needs: topNeeds
    });

  } catch (error) {
    console.error('Error retrieving stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}