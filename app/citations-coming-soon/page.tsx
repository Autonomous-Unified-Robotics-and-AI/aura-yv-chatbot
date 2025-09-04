"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  FileText, 
  ExternalLink, 
  ArrowLeft,
  Clock,
  Lightbulb,
  Database,
  Search
} from 'lucide-react';
import Link from 'next/link';

export default function CitationsComingSoonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Document Store
            </h1>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Coming Soon
            </Badge>
          </div>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            We&apos;re building a comprehensive document repository to make all Yale Ventures resources easily accessible and searchable.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                      {/* What&apos;s Coming */}
          <Card className="border-2 border-blue-200 bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Lightbulb className="h-5 w-5" />
                What&apos;s Coming
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Centralized Document Repository</h4>
                    <p className="text-sm text-gray-600">All Yale Ventures documents, guides, and resources in one searchable location</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Search className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Advanced Search & Filtering</h4>
                    <p className="text-sm text-gray-600">Find exactly what you need with intelligent search and categorization</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Document Previews</h4>
                    <p className="text-sm text-gray-600">Preview documents before downloading or opening them</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card className="border-2 border-orange-200 bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Clock className="h-5 w-5" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">AI Chat Integration</h4>
                    <p className="text-sm text-gray-600">Citations and references are already working in the chat</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Document Processing</h4>
                    <p className="text-sm text-gray-600">Setting up automated document ingestion and indexing</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">User Interface</h4>
                    <p className="text-sm text-gray-600">Building the document browser and search interface</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-green-200 bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-green-800 text-center">
                  Planned Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Document Categories</h4>
                    <p className="text-sm text-gray-600">Organized by topic, stage, and resource type</p>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Smart Search</h4>
                    <p className="text-sm text-gray-600">AI-powered search with semantic understanding</p>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ExternalLink className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Direct Access</h4>
                    <p className="text-sm text-gray-600">One-click access to documents and resources</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="lg:col-span-2 text-center">
            <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
              <CardContent className="py-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Stay Updated
                </h3>
                                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                   We&apos;re working hard to bring you the best document management experience. 
                   The document store will be available soon, making it easier than ever to 
                   access Yale Ventures resources.
                 </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Continue Chatting
                    </Button>
                  </Link>
                  
                  <Button variant="outline" size="lg" disabled>
                    <Clock className="h-4 w-4 mr-2" />
                    Notify When Ready
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 