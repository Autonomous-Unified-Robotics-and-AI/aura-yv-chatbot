#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function inspectDocument() {
  try {
    console.log('🔍 Inspecting the stored document...\n');
    
    const doc = await prisma.extractedData.findFirst({
      where: {
        dataType: 'enhanced_notion_extraction'
      },
      orderBy: { extractedAt: 'desc' }
    });
    
    if (!doc) {
      console.log('❌ No enhanced_notion_extraction documents found');
      return;
    }
    
    console.log('📄 Document Record:');
    console.log(`ID: ${doc.id}`);
    console.log(`Data Type: ${doc.dataType}`);
    console.log(`Source: ${doc.source}`);
    console.log(`Extracted: ${doc.extractedAt}`);
    console.log('\n📋 Content Structure:');
    
    const content = doc.content;
    
    if (Array.isArray(content)) {
      console.log(`Content is an array with ${content.length} items`);
      
      content.slice(0, 2).forEach((item, index) => {
        console.log(`\nItem ${index + 1}:`);
        console.log('  Keys:', Object.keys(item));
        
        if (item.text) {
          console.log('  Text preview:', item.text.substring(0, 100) + '...');
        }
        
        if (item.metadata) {
          console.log('  Metadata keys:', Object.keys(item.metadata));
          console.log('  doc_name:', item.metadata.doc_name || 'MISSING');
          console.log('  topic:', item.metadata.topic || 'MISSING');
          console.log('  chunk_index:', item.metadata.chunk_index || 'MISSING');
        } else {
          console.log('  ❌ No metadata found');
        }
      });
      
    } else if (typeof content === 'object' && content !== null) {
      console.log('Content is an object');
      console.log('Keys:', Object.keys(content));
      
      if (content.text) {
        console.log('Text preview:', content.text.substring(0, 100) + '...');
      }
      
      if (content.metadata) {
        console.log('Metadata keys:', Object.keys(content.metadata));
        console.log('doc_name:', content.metadata.doc_name || 'MISSING');
        console.log('topic:', content.metadata.topic || 'MISSING');
      } else {
        console.log('❌ No metadata found');
      }
    } else {
      console.log('Content type:', typeof content);
      console.log('Content:', content);
    }
    
  } catch (error) {
    console.error('❌ Error inspecting document:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDocument();