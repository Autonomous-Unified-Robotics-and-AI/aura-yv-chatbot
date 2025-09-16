import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  console.log('=== FEEDBACK API REQUEST START ===');
  
  try {
    const body = await request.json();
    const {
      session_id,
      overall_rating,
      helpfulness_rating,
      accuracy_rating,
      ease_of_use_rating,
      specific_feedback,
      improvement_suggestions,
      would_recommend,
      email
    } = body;

    console.log('Feedback request body:', {
      session_id,
      overall_rating,
      has_specific_feedback: !!specific_feedback,
      has_improvements: !!improvement_suggestions,
      would_recommend,
      has_email: !!email
    });

    // Validate required fields
    if (!overall_rating || overall_rating < 1 || overall_rating > 5) {
      console.log('Validation failed: Invalid overall rating:', overall_rating);
      return NextResponse.json(
        { error: 'Overall rating is required and must be between 1-5' },
        { status: 400 }
      );
    }

    // Verify session exists if session_id is provided - check local first, then try to sync from backend
    let validSessionId = null;
    if (session_id) {
      try {
        console.log('Checking session existence for:', session_id);
        
        // First, check if session exists locally
        let sessionExists = await prisma.userSession.findUnique({
          where: { sessionId: session_id }
        });
        
        if (sessionExists) {
          validSessionId = session_id;
          console.log('Session found locally:', session_id);
        } else {
          console.log('Session not found locally, checking if it exists in backend...');
          
          // Try to validate session with backend and sync if needed
          try {
            const backendUrl = process.env.BACKEND_URL || 
              (process.env.NODE_ENV === 'development' 
                ? 'http://localhost:8000' 
                : 'https://aurarag-production.up.railway.app');
            
            const backendResponse = await fetch(`${backendUrl}/api/sessions/${session_id}`, {
              timeout: 5000 // 5 second timeout
            } as any);
            
            if (backendResponse.ok) {
              const backendSessionData = await backendResponse.json();
              console.log('Session found in backend, attempting to sync locally');
              
              // Try to sync the session locally via bridge API
              try {
                const bridgeResponse = await fetch('http://localhost:3000/api/sessions/bridge', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    session_id: session_id,
                    backend_session_data: backendSessionData
                  })
                });
                
                if (bridgeResponse.ok) {
                  validSessionId = session_id;
                  console.log('Session synced from backend:', session_id);
                } else {
                  console.log('Failed to sync session from backend, will store feedback without session link');
                }
              } catch (bridgeError) {
                console.log('Bridge sync failed, storing feedback without session link');
              }
            } else {
              console.log('Session not found in backend either');
            }
          } catch (backendError) {
            console.log('Backend session check failed:', backendError);
          }
        }
        
      } catch (sessionError) {
        console.error('Session validation failed:', sessionError);
        console.log('Proceeding without session validation due to database error');
        // Don't fail the entire request - just proceed without session validation
      }
    } else {
      console.log('No session_id provided, storing anonymous feedback');
    }

    // Store feedback in database with retry logic
    let feedback;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Attempting to store feedback (attempt ${retryCount + 1}/${maxRetries})`);
        
        feedback = await prisma.userFeedback.create({
          data: {
            sessionId: validSessionId,
            overallRating: overall_rating,
            helpfulnessRating: helpfulness_rating || overall_rating,
            accuracyRating: accuracy_rating || overall_rating,
            easeOfUseRating: ease_of_use_rating || overall_rating,
            specificFeedback: specific_feedback || null,
            improvementSuggestions: improvement_suggestions || null,
            wouldRecommend: would_recommend ?? true,
            userEmail: email || null,
          },
        });
        
        console.log('Feedback stored successfully:', feedback.id);
        break; // Success, exit retry loop
        
      } catch (dbError) {
        retryCount++;
        console.error(`Database error on attempt ${retryCount}:`, dbError);
        
        if (retryCount >= maxRetries) {
          throw dbError; // Re-throw after max retries
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!feedback) {
      throw new Error('Failed to store feedback after all retries');
    }

    console.log('=== FEEDBACK API SUCCESS ===');
    return NextResponse.json({
      status: 'success',
      message: 'Feedback submitted successfully',
      id: feedback.id,
      session_linked: !!validSessionId
    });
    
  } catch (error) {
    console.error('=== FEEDBACK API ERROR ===');
    console.error('Full error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Try to determine if it's a database connection issue
    const isDatabaseError = error instanceof Error && (
      error.message.includes('database') ||
      error.message.includes('connection') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('prisma')
    );
    
    const errorResponse = {
      error: 'Failed to submit feedback',
      message: isDatabaseError 
        ? 'Database connection issue. Please try again.' 
        : 'An unexpected error occurred. Please try again.',
      details: process.env.NODE_ENV === 'development' ? {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack',
        isDatabaseError
      } : undefined
    };
    
    console.log('Returning error response:', errorResponse);
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}