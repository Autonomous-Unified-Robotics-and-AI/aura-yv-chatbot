import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DocumentSummary {
  id: string;
  title: string;
  topic: string;
  chunk_count: number;
  preview: string;
  source_url?: string;
  extracted_at: string;
}

async function getDocumentList(): Promise<DocumentSummary[]> {
  try {
    // Query documents from database
    const extractedDocs = await prisma.extractedData.findMany({
      where: {
        dataType: {
          in: ['enhanced_notion_extraction', 'notion_extraction', 'document_extraction']
        }
      },
      orderBy: {
        extractedAt: 'desc'
      }
    });

    const documentSummaries: DocumentSummary[] = [];
    const seenDocuments = new Set<string>();

    for (const doc of extractedDocs) {
      const content = doc.content as any;
      
      // Handle different content structures
      if (content.text && content.metadata) {
        // Single document
        const docName = content.metadata.doc_name;
        if (!seenDocuments.has(docName)) {
          seenDocuments.add(docName);
          documentSummaries.push({
            id: docName,
            title: docName,
            topic: content.metadata.topic || 'General',
            chunk_count: 1,
            preview: content.text.substring(0, 200) + (content.text.length > 200 ? '...' : ''),
            source_url: content.metadata.source_url || content.metadata.document_url,
            extracted_at: doc.extractedAt.toISOString()
          });
        }
      } else if (Array.isArray(content)) {
        // Multiple documents in one record
        const docGroups = new Map<string, any[]>();
        
        for (const item of content) {
          if (item.text && item.metadata) {
            const docName = item.metadata.doc_name;
            if (!docGroups.has(docName)) {
              docGroups.set(docName, []);
            }
            docGroups.get(docName)!.push(item);
          }
        }
        
        for (const [docName, items] of docGroups) {
          if (!seenDocuments.has(docName)) {
            seenDocuments.add(docName);
            const firstItem = items[0];
            documentSummaries.push({
              id: docName,
              title: docName,
              topic: firstItem.metadata.topic || 'General',
              chunk_count: items.length,
              preview: firstItem.text.substring(0, 200) + (firstItem.text.length > 200 ? '...' : ''),
              source_url: firstItem.metadata.source_url || firstItem.metadata.document_url,
              extracted_at: doc.extractedAt.toISOString()
            });
          }
        }
      }
    }

    return documentSummaries;
    
  } catch (error) {
    console.error('Error getting document list:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get document list
    let documents = await getDocumentList();
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      documents = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchLower) ||
        doc.topic.toLowerCase().includes(searchLower) ||
        doc.preview.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const total = documents.length;
    const paginatedDocs = documents.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      documents: paginatedDocs,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}