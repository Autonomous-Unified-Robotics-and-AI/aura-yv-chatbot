#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugCitations() {
  try {
    console.log('🔍 Debugging citation document matching...\n');
    
    // Get extracted documents
    const extractedData = await prisma.extractedData.findMany({
      where: {
        dataType: {
          in: ['enhanced_notion_extraction', 'notion_extraction', 'document_extraction']
        }
      },
      orderBy: { extractedAt: 'desc' },
      take: 5
    });
    
    console.log('📄 Available Documents in Database:');
    extractedData.forEach((data, index) => {
      const content = data.content;
      
      if (Array.isArray(content)) {
        console.log(`\n${index + 1}. Record ID: ${data.id}`);
        console.log(`   Data Type: ${data.dataType}`);
        console.log(`   Source: ${data.source}`);
        console.log(`   Documents in this record: ${content.length}`);
        
        // Show first few document names
        content.slice(0, 3).forEach((doc, docIndex) => {
          if (doc.metadata && doc.metadata.doc_name) {
            console.log(`     - Document ${docIndex + 1}: "${doc.metadata.doc_name}"`);
            console.log(`       Topic: ${doc.metadata.topic || 'N/A'}`);
            console.log(`       Chunk Index: ${doc.metadata.chunk_index || 'N/A'}`);
          }
        });
        
        if (content.length > 3) {
          console.log(`     ... and ${content.length - 3} more documents`);
        }
      } else if (content && content.metadata) {
        console.log(`\n${index + 1}. Record ID: ${data.id}`);
        console.log(`   Document: "${content.metadata.doc_name}"`);
        console.log(`   Topic: ${content.metadata.topic || 'N/A'}`);
        console.log(`   Source: ${data.source}`);
      }
    });
    
    // Test some common document ID formats
    console.log('\n🧪 Testing Common Document ID Formats:');
    const testIds = [
      'Yale Ventures',
      'yale ventures',
      'funding guide',
      'Funding Guide',
      'startup resources',
      'test-document',
      'unknown'
    ];
    
    for (const testId of testIds) {
      console.log(`\n   Testing ID: "${testId}"`);
      
      // Simulate the matching logic from our API
      let found = false;
      
      for (const data of extractedData) {
        const content = data.content;
        
        if (Array.isArray(content)) {
          for (const doc of content) {
            if (doc.metadata && doc.metadata.doc_name) {
              if (doc.metadata.doc_name === testId ||
                  doc.metadata.doc_name.toLowerCase().includes(testId.toLowerCase())) {
                console.log(`     ✅ Found match: "${doc.metadata.doc_name}"`);
                found = true;
                break;
              }
            }
          }
        } else if (content && content.metadata && content.metadata.doc_name) {
          if (content.metadata.doc_name === testId ||
              content.metadata.doc_name.toLowerCase().includes(testId.toLowerCase())) {
            console.log(`     ✅ Found match: "${content.metadata.doc_name}"`);
            found = true;
          }
        }
        
        if (found) break;
      }
      
      if (!found) {
        console.log(`     ❌ No match found`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging citations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCitations();