#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs/promises');
const path = require('path');

const prisma = new PrismaClient();

async function copyDocumentsToPublic() {
  try {
    console.log('📁 Copying documents to permanent storage...\n');
    
    // Create documents directory if it doesn't exist
    const documentsDir = path.join(process.cwd(), 'public', 'documents');
    await fs.mkdir(documentsDir, { recursive: true });
    
    // Get extracted documents
    const extractedData = await prisma.extractedData.findMany({
      where: {
        dataType: {
          in: ['enhanced_notion_extraction', 'notion_extraction', 'document_extraction']
        }
      },
      orderBy: { extractedAt: 'desc' }
    });

    let copiedCount = 0;
    let errorCount = 0;

    for (const data of extractedData) {
      const content = data.content;
      let sources = [];
      
      // Extract source URLs
      if (Array.isArray(content)) {
        sources = content.map(item => item.metadata?.source_url).filter(Boolean);
      } else if (content?.metadata?.source_url) {
        sources = [content.metadata.source_url];
      }

      for (const sourceUrl of sources) {
        try {
          // Check if source file still exists
          await fs.access(sourceUrl);
          
          const fileName = path.basename(sourceUrl);
          const destPath = path.join(documentsDir, fileName);
          
          // Check if already exists
          try {
            await fs.access(destPath);
            console.log(`⏭️  Skipping ${fileName} (already exists)`);
            continue;
          } catch (e) {
            // File doesn't exist, copy it
          }
          
          // Copy file
          await fs.copyFile(sourceUrl, destPath);
          console.log(`✅ Copied: ${fileName}`);
          copiedCount++;
          
        } catch (error) {
          console.log(`❌ Failed to copy ${path.basename(sourceUrl)}: File not found`);
          errorCount++;
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successfully copied: ${copiedCount} files`);
    console.log(`   ❌ Failed to copy: ${errorCount} files`);
    console.log(`   📁 Files stored in: ${documentsDir}`);
    
    if (copiedCount > 0) {
      console.log(`\n🎉 You can now access original files via the "Original File" button in the admin panel!`);
    } else {
      console.log(`\n⚠️  No files were copied. Original files may have been cleaned up.`);
      console.log(`   To preserve files in the future, modify the enhanced processor to copy files during extraction.`);
    }
    
  } catch (error) {
    console.error('❌ Error copying documents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

copyDocumentsToPublic();