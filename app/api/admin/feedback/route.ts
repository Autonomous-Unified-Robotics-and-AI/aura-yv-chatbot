import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET endpoint to retrieve feedback data for admin
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

    // Get all feedback from database
    const feedback = await prisma.userFeedback.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to recent 100 feedback entries
    });

    // Calculate statistics
    const totalFeedback = feedback.length;
    let averageRating = 0;
    let recommendationRate = 0;

    if (totalFeedback > 0) {
      averageRating = feedback.reduce((sum, f) => sum + f.overallRating, 0) / totalFeedback;
      recommendationRate = feedback.filter(f => f.wouldRecommend).length / totalFeedback;
    }

    // Transform data to match expected format
    const transformedFeedback = feedback.map(f => ({
      id: f.id,
      session_id: f.sessionId,
      overall_rating: f.overallRating,
      helpfulness_rating: f.helpfulnessRating,
      accuracy_rating: f.accuracyRating,
      ease_of_use_rating: f.easeOfUseRating,
      specific_feedback: f.specificFeedback || '',
      improvement_suggestions: f.improvementSuggestions || '',
      would_recommend: f.wouldRecommend,
      email: f.userEmail,
      timestamp: f.timestamp.toISOString(),
    }));

    return NextResponse.json({
      total_feedback: totalFeedback,
      average_rating: Math.round(averageRating * 100) / 100,
      recommendation_rate: Math.round(recommendationRate * 1000) / 1000,
      feedback: transformedFeedback
    });

  } catch (error) {
    console.error('Error retrieving feedback:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST endpoint to store feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      overallRating,
      helpfulnessRating,
      accuracyRating,
      easeOfUseRating,
      specificFeedback,
      improvementSuggestions,
      wouldRecommend,
      email
    } = body;

    const feedback = await prisma.userFeedback.create({
      data: {
        sessionId: sessionId || null,
        overallRating,
        helpfulnessRating,
        accuracyRating,
        easeOfUseRating,
        specificFeedback: specificFeedback || null,
        improvementSuggestions: improvementSuggestions || null,
        wouldRecommend,
        userEmail: email || null,
      },
    });

    return NextResponse.json({
      success: true,
      id: feedback.id,
      message: 'Feedback stored successfully'
    });

  } catch (error) {
    console.error('Error storing feedback:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to store feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}