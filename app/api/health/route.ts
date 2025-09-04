import { NextResponse } from 'next/server';
import { prisma, checkDatabaseConnection } from '@/lib/prisma';

export async function GET() {
  console.log('=== HEALTH CHECK START ===');
  
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    checks: {
      database: 'checking...',
      prisma: 'checking...',
      environment: 'checking...'
    },
    details: {} as any
  };

  try {
    // Check environment variables
    const envVars = {
      PRISMA_DATABASE_URL: !!process.env.PRISMA_DATABASE_URL,
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      NODE_ENV: process.env.NODE_ENV
    };
    
    healthCheck.checks.environment = 'ok';
    healthCheck.details.environment = envVars;
    console.log('Environment check passed:', envVars);

    // Check Prisma connection
    try {
      await prisma.$connect();
      healthCheck.checks.prisma = 'ok';
      console.log('Prisma connection successful');
    } catch (prismaError) {
      healthCheck.checks.prisma = 'failed';
      healthCheck.details.prismaError = prismaError instanceof Error ? prismaError.message : 'Unknown prisma error';
      console.error('Prisma connection failed:', prismaError);
    }

    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    healthCheck.checks.database = dbConnected ? 'ok' : 'failed';

    // Try a simple database query
    try {
      const sessionCount = await prisma.userSession.count();
      healthCheck.details.database = {
        sessionCount,
        connectionStatus: 'ok'
      };
      console.log('Database query successful, session count:', sessionCount);
    } catch (dbError) {
      healthCheck.checks.database = 'failed';
      healthCheck.details.databaseError = dbError instanceof Error ? dbError.message : 'Unknown database error';
      console.error('Database query failed:', dbError);
    }

    // Overall health status
    const allChecksOk = Object.values(healthCheck.checks).every(check => check === 'ok');
    healthCheck.status = allChecksOk ? 'ok' : 'degraded';

    console.log('=== HEALTH CHECK COMPLETE ===');
    console.log('Overall status:', healthCheck.status);
    
    return NextResponse.json(healthCheck, { 
      status: allChecksOk ? 200 : 503 
    });

  } catch (error) {
    console.error('=== HEALTH CHECK ERROR ===');
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: healthCheck.checks
    }, { 
      status: 500 
    });
  }
}

export async function POST() {
  // Allow POST requests for easier testing
  return GET();
}