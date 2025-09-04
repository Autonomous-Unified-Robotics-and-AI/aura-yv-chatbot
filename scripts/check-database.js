#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database for extracted documents...\n');
    
    // Check extraction jobs
    const jobs = await prisma.dataExtractionJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5
    });
    
    console.log('📊 Recent Extraction Jobs:');
    jobs.forEach(job => {
      console.log(`  ${job.jobType} - ${job.status} (${job.resultCount} results)`);
      console.log(`    Source: ${job.source}`);
      console.log(`    Started: ${job.startedAt.toISOString()}`);
      if (job.completedAt) {
        console.log(`    Completed: ${job.completedAt.toISOString()}`);
      }
      if (job.error) {
        console.log(`    Error: ${job.error}`);
      }
      console.log();
    });
    
    // Check extracted data
    const extractedData = await prisma.extractedData.findMany({
      where: {
        dataType: {
          in: ['enhanced_notion_extraction', 'notion_extraction', 'document_extraction']
        }
      },
      orderBy: { extractedAt: 'desc' },
      take: 10
    });
    
    console.log('📄 Recent Extracted Data:');
    extractedData.forEach(data => {
      const content = data.content;
      let docCount = 0;
      let firstDocName = 'Unknown';
      
      if (Array.isArray(content)) {
        docCount = content.length;
        if (content[0] && content[0].metadata) {
          firstDocName = content[0].metadata.doc_name || 'Unknown';
        }
      } else if (content && content.metadata) {
        docCount = 1;
        firstDocName = content.metadata.doc_name || 'Unknown';
      }
      
      console.log(`  ${data.dataType} - ${docCount} documents`);
      console.log(`    First doc: ${firstDocName}`);
      console.log(`    Source: ${data.source || 'N/A'}`);
      console.log(`    Extracted: ${data.extractedAt.toISOString()}`);
      console.log();
    });
    
    // Summary statistics
    const totalExtracted = await prisma.extractedData.count({
      where: {
        dataType: {
          in: ['enhanced_notion_extraction', 'notion_extraction', 'document_extraction']
        }
      }
    });
    
    const totalJobs = await prisma.dataExtractionJob.count();
    const completedJobs = await prisma.dataExtractionJob.count({
      where: { status: 'completed' }
    });
    
    console.log('📈 Summary Statistics:');
    console.log(`  Total extraction jobs: ${totalJobs}`);
    console.log(`  Completed jobs: ${completedJobs}`);
    console.log(`  Total extracted data records: ${totalExtracted}`);
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();