"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Eye, 
  Calendar,
  Hash,
  Tag,
  ExternalLink,
  RefreshCw,
  Download
} from 'lucide-react';

interface DocumentSummary {
  id: string;
  title: string;
  topic: string | string[];
  chunk_count: number;
  preview: string;
  source_url?: string;
  extracted_at: string;
}

interface DocumentResponse {
  success: boolean;
  documents: DocumentSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [viewingDocument, setViewingDocument] = useState(false);

  const fetchDocuments = async (search?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');
      
      const response = await fetch(`/documents?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: DocumentResponse = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
      } else {
        throw new Error('Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const viewDocument = async (documentId: string) => {
    setViewingDocument(true);
    
    try {
      const response = await fetch(`/documents/${encodeURIComponent(documentId)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSelectedDocument(data.document);
      } else {
        throw new Error('Failed to fetch document details');
      }
    } catch (err) {
      console.error('Error fetching document:', err);
      alert(`Error loading document: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setViewingDocument(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments(searchTerm);
  };

  const formatTopics = (topic: string | string[]) => {
    if (Array.isArray(topic)) {
      return topic;
    }
    if (typeof topic === 'string') {
      return [topic];
    }
    return ['General'];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Document Management</h1>
        <p className="text-gray-600">Browse and manage extracted documents from the knowledge base</p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search documents by title, topic, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                fetchDocuments();
              }}
            >
              Clear
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-700">
              <span className="font-medium">Error: {error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchDocuments()}
                className="ml-4"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading documents...</span>
        </div>
      )}

      {/* Documents List */}
      {!loading && documents.length > 0 && (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Found {documents.length} document{documents.length !== 1 ? 's' : ''}
          </div>
          
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        {doc.title}
                      </CardTitle>
                      
                      {/* Topics */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {formatTopics(doc.topic).map((topic, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {topic}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {doc.chunk_count} chunk{doc.chunk_count !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(doc.extracted_at)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => viewDocument(doc.id)}
                        disabled={viewingDocument}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Text
                      </Button>
                      
                      {doc.source_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const fileName = doc.source_url!.split('/').pop() || doc.title;
                            window.open(`/files/${encodeURIComponent(fileName)}`, '_blank');
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Original File
                        </Button>
                      )}
                      
                      {doc.source_url && !doc.source_url.startsWith('/var/folders') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.source_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Source
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {doc.preview}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && documents.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? `No documents match your search for "${searchTerm}"`
                : "No documents have been extracted yet. Run the enhanced notion processor to add documents."
              }
            </p>
            <Button onClick={() => fetchDocuments()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {selectedDocument.title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDocument(null)}
              >
                ✕
              </Button>
            </CardHeader>
            
            <CardContent className="overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                {/* Metadata */}
                <div className="border-b pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Topics:</strong>{' '}
                      {formatTopics(selectedDocument.metadata?.topic || selectedDocument.topic || 'General').join(', ')}
                    </div>
                    <div>
                      <strong>Chunks:</strong> {selectedDocument.chunks?.length || 1}
                    </div>
                    {selectedDocument.source_url && (
                      <div className="md:col-span-2">
                        <strong>Source:</strong>{' '}
                        <span className="break-all text-gray-600">{selectedDocument.source_url}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Content */}
                <div>
                  <h4 className="font-medium mb-2">Content:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {selectedDocument.content}
                    </pre>
                  </div>
                </div>
                
                {/* Chunks (if multiple) */}
                {selectedDocument.chunks && selectedDocument.chunks.length > 1 && (
                  <div>
                    <h4 className="font-medium mb-2">All Chunks ({selectedDocument.chunks.length}):</h4>
                    <div className="space-y-2">
                      {selectedDocument.chunks.map((chunk: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="text-sm text-gray-600 mb-1">
                            Chunk {chunk.index || index + 1}
                          </div>
                          <div className="text-sm">
                            {chunk.text.substring(0, 200)}
                            {chunk.text.length > 200 && '...'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}