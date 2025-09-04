import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST endpoint to store extracted data from backend
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      sessionId, 
      dataType, 
      source, 
      content, 
      metadata 
    } = body;

    // Store the extracted data
    const extractedData = await prisma.extractedData.create({
      data: {
        sessionId,
        dataType,
        source,
        content,
        metadata: metadata || {},
      },
    });

    return NextResponse.json({
      success: true,
      id: extractedData.id,
      message: 'Data stored successfully'
    });

  } catch (error) {
    console.error('Error storing extracted data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to store extracted data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve extracted data for admin
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const dataType = url.searchParams.get('dataType');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const where: any = {};
    if (sessionId) where.sessionId = sessionId;
    if (dataType) where.dataType = dataType;

    const extractedData = await prisma.extractedData.findMany({
      where,
      orderBy: { extractedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: extractedData,
      count: extractedData.length
    });

  } catch (error) {
    console.error('Error retrieving extracted data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve extracted data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}