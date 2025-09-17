import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    const filePath = pathArray.join('/');
    console.log(`📁 File request for: ${filePath}`);
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Find document with this file path
    const extractedDocs = await prisma.extractedData.findMany({
      where: {
        dataType: {
          in: ['enhanced_notion_extraction', 'notion_extraction', 'document_extraction']
        }
      }
    });

    let matchingDoc = null;
    let originalFilePath = null;

    for (const doc of extractedDocs) {
      const content = doc.content as any;
      
      // Handle different content structures
      if (content?.metadata) {
        const metadata = content.metadata;
        
        // Check permanent path first (preferred)
        if (metadata.permanent_file_path) {
          const permanentFileName = path.basename(metadata.permanent_file_path);
          if (permanentFileName === filePath || metadata.permanent_file_path.includes(filePath)) {
            matchingDoc = doc;
            originalFilePath = metadata.permanent_file_path;
            
            // If it's a cloud storage URL, redirect to it directly
            if (originalFilePath.startsWith('http')) {
              console.log(`🌐 Redirecting to cloud storage: ${originalFilePath}`);
              return NextResponse.redirect(originalFilePath);
            }
            break;
          }
        }
        
        // Fallback to original source_url
        if (metadata.source_url) {
          const sourceUrl = metadata.source_url;
          if (sourceUrl.includes(filePath) || path.basename(sourceUrl) === filePath) {
            matchingDoc = doc;
            originalFilePath = sourceUrl;
            break;
          }
        }
      }
      
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.metadata) {
            const metadata = item.metadata;
            
            // Check permanent path first (preferred)
            if (metadata.permanent_file_path) {
              const permanentFileName = path.basename(metadata.permanent_file_path);
              if (permanentFileName === filePath || metadata.permanent_file_path.includes(filePath)) {
                matchingDoc = doc;
                originalFilePath = metadata.permanent_file_path;
                
                // If it's a cloud storage URL, redirect to it directly
                if (originalFilePath.startsWith('http')) {
                  console.log(`🌐 Redirecting to cloud storage: ${originalFilePath}`);
                  return NextResponse.redirect(originalFilePath);
                }
                break;
              }
            }
            
            // Fallback to original source_url
            if (metadata.source_url) {
              const sourceUrl = metadata.source_url;
              if (sourceUrl.includes(filePath) || path.basename(sourceUrl) === filePath) {
                matchingDoc = doc;
                originalFilePath = sourceUrl;
                break;
              }
            }
          }
        }
        if (matchingDoc) break;
      }
    }

    if (!matchingDoc || !originalFilePath) {
      return NextResponse.json(
        { error: 'File not found in database' },
        { status: 404 }
      );
    }

    // Check if the original file still exists, or check permanent storage
    let actualFilePath = originalFilePath;
    
    try {
      await fs.access(originalFilePath);
    } catch (error) {
      // File doesn't exist at original location, check permanent storage
      const fileName = path.basename(originalFilePath);
      const permanentPath = path.join(process.cwd(), 'public', 'documents', fileName);
      
      try {
        await fs.access(permanentPath);
        actualFilePath = permanentPath;
        console.log(`📁 Found file in permanent storage: ${permanentPath}`);
      } catch (permanentError) {
        return NextResponse.json(
          { 
            error: 'Original file not found',
            message: 'The original file may have been moved or deleted. Files are temporarily stored during processing. To preserve files, they need to be copied to permanent storage during extraction.',
            originalPath: originalFilePath,
            checkedPaths: [originalFilePath, permanentPath]
          },
          { status: 404 }
        );
      }
    }

    // Read and serve the file
    const fileBuffer = await fs.readFile(actualFilePath);
    const fileName = path.basename(actualFilePath);
    const ext = path.extname(fileName).toLowerCase();
    
    // Determine content type
    let contentType = 'application/octet-stream';
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.pptx':
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.csv':
        contentType = 'text/csv';
        break;
    }

    // Return the file
    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      }
    });

  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}