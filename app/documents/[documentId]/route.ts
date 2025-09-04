import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DocumentMetadata {
  doc_name: string;
  chunk_index?: number;
  topic?: string;
  document_url?: string;
  source_url?: string;
  [key: string]: any;
}

interface ExtractedDocument {
  id: string;
  content: {
    text: string;
    metadata: DocumentMetadata;
  };
  metadata?: any;
  source?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const { documentId } = params;
    
    // Debug logging
    console.log(`🔍 Document API request for ID: "${documentId}"`);
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

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

    if (extractedDocs.length === 0) {
      return NextResponse.json(
        { error: 'No documents available' },
        { status: 404 }
      );
    }

    // Find matching documents
    let matchingDocs: ExtractedDocument[] = [];
    
    for (const doc of extractedDocs) {
      const content = doc.content as any;
      
      // Handle different content structures
      if (content.text && content.metadata) {
        // Single document
        const docData: ExtractedDocument = {
          id: doc.id,
          content,
          metadata: doc.metadata,
          source: doc.source || undefined
        };
        
        // Check if this document matches our search
        if (matchesDocument(docData, documentId)) {
          matchingDocs.push(docData);
        }
      } else if (Array.isArray(content)) {
        // Multiple documents in one record
        for (const item of content) {
          if (item.text && item.metadata) {
            const docData: ExtractedDocument = {
              id: `${doc.id}_${item.metadata.chunk_index || 0}`,
              content: item,
              metadata: doc.metadata,
              source: doc.source || undefined
            };
            
            if (matchesDocument(docData, documentId)) {
              matchingDocs.push(docData);
            }
          }
        }
      }
    }

    if (matchingDocs.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Return the first matching document with all related chunks
    const primaryDoc = matchingDocs[0];
    const docName = primaryDoc.content.metadata.doc_name;
    
    // Get all chunks for the same document
    const allChunksForDoc = matchingDocs.filter(doc => 
      doc.content.metadata.doc_name === docName
    );

    return NextResponse.json({
      success: true,
      document: {
        id: documentId,
        title: primaryDoc.content.metadata.doc_name,
        content: primaryDoc.content.text,
        source_url: primaryDoc.content.metadata.source_url || primaryDoc.content.metadata.document_url,
        chunks: allChunksForDoc.map((doc, index) => ({
          index: doc.content.metadata.chunk_index || index,
          text: doc.content.text,
          metadata: {
            ...doc.content.metadata,
            topic: doc.content.metadata.topic,
            doc_name: doc.content.metadata.doc_name,
            source_url: doc.content.metadata.source_url,
            document_url: doc.content.metadata.document_url
          }
        })),
        metadata: {
          ...primaryDoc.content.metadata,
          total_chunks: allChunksForDoc.length,
          topic: primaryDoc.content.metadata.topic,
          doc_name: primaryDoc.content.metadata.doc_name,
          source_url: primaryDoc.content.metadata.source_url,
          document_url: primaryDoc.content.metadata.document_url
        }
      }
    });

  } catch (error) {
    console.error('Error serving document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function matchesDocument(doc: ExtractedDocument, documentId: string): boolean {
  const metadata = doc.content.metadata;
  
  // Try different matching strategies
  if (documentId.includes('_chunk_')) {
    // Format: docname_chunk_123
    const [docName, , chunkIndex] = documentId.split('_chunk_');
    return metadata.doc_name === docName && 
           metadata.chunk_index === parseInt(chunkIndex);
  }
  
  // Try matching by doc_name
  if (metadata.doc_name === documentId) {
    return true;
  }
  
  // Try partial matching
  if (metadata.doc_name?.toLowerCase().includes(documentId.toLowerCase())) {
    return true;
  }
  
  // Try matching by document ID
  if (doc.id === documentId) {
    return true;
  }
  
  return false;
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