"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  FileText, 
  ExternalLink, 
  BookOpen, 
  Clock,
  Eye
} from 'lucide-react';

// Demo citations showing different types
const demoCitations = [
  {
    rank: 1,
    document: "Yale Ventures Startup Guide",
    relevance_score: 0.95,
    content: "This guide provides comprehensive information about starting a venture at Yale...",
    metadata: {
      source_url: "https://yaleventures.yale.edu/startup-guide",
      doc_type: "web"
    }
  },
  {
    rank: 2,
    document: "Funding Application Template.pdf",
    relevance_score: 0.88,
    content: "The funding application template includes all necessary forms and requirements...",
    metadata: {
      source_url: "/documents/funding-template.pdf",
      doc_type: "pdf"
    }
  },
  {
    rank: 3,
    document: "Notion Database - Resources",
    relevance_score: 0.82,
    content: "Our comprehensive resource database contains curated materials...",
    metadata: {
      notion_url: "https://yaleventures.notion.site/resources",
      doc_type: "notion"
    }
  },
  {
    rank: 4,
    document: "Internal Policy Document.docx",
    relevance_score: 0.76,
    content: "Internal policies and procedures for venture development...",
    metadata: {
      source_url: "/internal/policies.docx",
      doc_type: "docx"
    }
  },
  {
    rank: 5,
    document: "No Link Document",
    relevance_score: 0.70,
    content: "This document has no associated links or metadata...",
    metadata: {}
  }
];

export function CitationDemo() {
  // Helper function to detect if a URL points to a file
  const isFileUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      
      // Common file extensions
      const fileExtensions = [
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.txt', '.rtf', '.csv', '.json', '.xml', '.html', '.htm',
        '.md', '.markdown', '.tex', '.odt', '.ods', '.odp'
      ];
      
      // Check if the path ends with a file extension
      const hasFileExtension = fileExtensions.some(ext => pathname.endsWith(ext));
      
      // Check if the path contains file-like patterns
      const hasFilePattern = pathname.includes('/files/') || 
                            pathname.includes('/documents/') || 
                            pathname.includes('/uploads/') ||
                            pathname.includes('/assets/') ||
                            pathname.includes('/media/') ||
                            pathname.includes('/internal/');
      
      return hasFileExtension || hasFilePattern;
    } catch (error) {
      // If URL parsing fails, assume it might be a file
      return true;
    }
  };

  const handleCitationClick = (citation: any) => {
    const { metadata } = citation;
    
    if (metadata?.notion_url) {
      console.log("Opening Notion link:", metadata.notion_url);
      // In real app: window.open(metadata.notion_url, '_blank');
    } else if (metadata?.source_url) {
      if (isFileUrl(metadata.source_url)) {
        console.log("File-based citation - redirecting to coming soon page");
        // In real app: window.location.href = '/citations-coming-soon';
      } else {
        console.log("Website URL - opening:", metadata.source_url);
        // In real app: window.open(metadata.source_url, '_blank');
      }
    } else {
      console.log("No valid links - redirecting to coming soon page");
      // In real app: window.location.href = '/citations-coming-soon';
    }
  };

  const getDocumentIcon = (docType?: string) => {
    switch (docType?.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'notion':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'web':
        return <ExternalLink className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Citation Handling Demo</h2>
        <p className="text-gray-600">
          This demonstrates how different types of citations are now handled:
        </p>
        <div className="flex flex-wrap gap-2 justify-center mt-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <ExternalLink className="h-3 w-3 mr-1" />
            Website Links - Open normally
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <BookOpen className="h-3 w-3 mr-1" />
            Notion Links - Open normally
          </Badge>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <Clock className="h-3 w-3 mr-1" />
            File Links - Redirect to Coming Soon
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {demoCitations.map((citation, index) => {
          const hasActionableLinks = (() => {
            if (citation.metadata?.notion_url) return true;
            if (citation.metadata?.source_url && !isFileUrl(citation.metadata.source_url)) return true;
            return false;
          })();

          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getDocumentIcon(citation.metadata?.doc_type)}
                    <CardTitle className="text-sm font-medium truncate">
                      {citation.document}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      #{citation.rank}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        hasActionableLinks 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-orange-50 text-orange-700'
                      }`}
                    >
                      {hasActionableLinks ? 'Actionable' : 'Coming Soon'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-3">{citation.content}</p>
                
                <div className="flex gap-2 flex-wrap">
                  {citation.metadata?.notion_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCitationClick(citation)}
                      className="flex items-center gap-1"
                    >
                      <BookOpen className="h-3 w-3" />
                      View in Notion
                    </Button>
                  )}
                  
                  {citation.metadata?.source_url && (
                    isFileUrl(citation.metadata.source_url) ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCitationClick(citation)}
                        className="flex items-center gap-1 bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200"
                      >
                        <Clock className="h-3 w-3" />
                        Document Store Coming Soon
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCitationClick(citation)}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open Link
                      </Button>
                    )
                  )}
                  
                  {!citation.metadata?.notion_url && !citation.metadata?.source_url && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCitationClick(citation)}
                      className="flex items-center gap-1 bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200"
                    >
                      <Clock className="h-3 w-3" />
                      Coming Soon
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-500 mt-6">
        <p>Check the browser console to see the different handling behaviors</p>
        <p className="mt-1">
          <Eye className="h-3 w-3 inline mr-1" />
          File-based citations now redirect to the Document Store Coming Soon page
        </p>
      </div>
    </div>
  );
} 