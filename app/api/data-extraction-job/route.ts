import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST endpoint to create/update data extraction jobs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      jobType, 
      source, 
      status = 'pending',
      error,
      resultCount,
      metadata 
    } = body;

    // Create or update job
    const job = await prisma.dataExtractionJob.create({
      data: {
        jobType,
        source,
        status,
        error,
        resultCount: resultCount || 0,
        metadata: metadata || {},
        completedAt: status === 'completed' ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      job,
      message: 'Job created successfully'
    });

  } catch (error) {
    console.error('Error creating extraction job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create extraction job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT endpoint to update existing job
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id,
      status,
      error,
      resultCount,
      metadata 
    } = body;

    const updateData: any = {
      status,
      resultCount: resultCount || 0,
    };

    if (error) updateData.error = error;
    if (metadata) updateData.metadata = metadata;
    if (status === 'completed') updateData.completedAt = new Date();

    const job = await prisma.dataExtractionJob.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      job,
      message: 'Job updated successfully'
    });

  } catch (error) {
    console.error('Error updating extraction job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update extraction job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve extraction jobs
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const jobType = url.searchParams.get('jobType');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const where: any = {};
    if (jobType) where.jobType = jobType;
    if (status) where.status = status;

    const jobs = await prisma.dataExtractionJob.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length
    });

  } catch (error) {
    console.error('Error retrieving extraction jobs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve extraction jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}