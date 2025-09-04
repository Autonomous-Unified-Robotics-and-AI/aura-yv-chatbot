"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminApi } from '@/hooks/use-admin-api';
import { 
  FileText, 
  Database,
  Activity,
  Users,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  Star
} from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  documents: {
    total: number;
    recent: number;
  };
  sessions: {
    total: number;
    active: number;
    recent: number;
  };
  messages: {
    total: number;
    withRag: number;
    ragPercentage: number;
  };
  feedback: {
    total: number;
    recent: number;
    avgRating: number;
  };
  userProfiles: Record<string, number>;
  extractionJobs: Record<string, number>;
  systemStatus: string;
  lastUpdated: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authenticatedFetch } = useAdminApi();

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch both stats and feedback data in parallel
      const [statsResponse, feedbackResponse] = await Promise.all([
        authenticatedFetch('/api/admin/stats'),
        authenticatedFetch('/api/admin/feedback')
      ]);
      
      if (!statsResponse.ok) {
        throw new Error(`Stats API error: ${statsResponse.status} ${statsResponse.statusText}`);
      }
      
      const statsResponse_data = await statsResponse.json();
      let feedbackResponse_data = null;
      let feedbackResult = null;
      
      // Extract data from wrapped responses
      const statsResult = statsResponse_data.success ? statsResponse_data.data : statsResponse_data;
      
      // Feedback endpoint might not exist or fail, so handle gracefully
      if (feedbackResponse.ok) {
        try {
          feedbackResponse_data = await feedbackResponse.json();
          feedbackResult = feedbackResponse_data.success ? feedbackResponse_data.data : feedbackResponse_data;
        } catch (e) {
          console.warn('Failed to parse feedback data:', e);
        }
      }
      
      // Transform the backend stats to match our expected format
      const transformedStats: AdminStats = {
        documents: {
          total: 0, // Backend doesn't track documents in this endpoint
          recent: 0
        },
        sessions: {
          total: statsResult.total_sessions || 0,
          active: statsResult.active_sessions || 0,
          recent: statsResult.active_sessions || 0
        },
        messages: {
          total: statsResult.total_messages || 0,
          withRag: 0, // Backend doesn't provide this detail
          ragPercentage: 0
        },
        feedback: {
          total: feedbackResult?.total_feedback || 0,
          recent: feedbackResult?.total_feedback || 0,
          avgRating: feedbackResult?.average_rating || 0
        },
        userProfiles: {}, // Backend doesn't provide this breakdown
        extractionJobs: {}, // Backend doesn't track extraction jobs
        systemStatus: 'online', // Assume online if we can fetch stats
        lastUpdated: new Date().toISOString()
      };
      
      setStats(transformedStats);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'maintenance': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading dashboard</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button onClick={fetchStats} className="mt-3" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage and monitor the Yale Ventures AI Assistant</p>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? formatNumber(stats.documents.total) : '...'}</div>
            <p className="text-xs text-muted-foreground">Extracted documents</p>
          </CardContent>
        </Card>
        
        <Link href="/admin/sessions">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats ? formatNumber(stats.sessions.total) : '...'}</div>
              <p className="text-xs text-muted-foreground">
                {stats ? `${stats.sessions.active} active (24h)` : 'Loading...'}
              </p>
            </CardContent>
          </Card>
        </Link>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? formatNumber(stats.messages.total) : '...'}</div>
            <p className="text-xs text-muted-foreground">
              {stats ? `${stats.messages.ragPercentage}% used RAG` : 'Loading...'}
            </p>
          </CardContent>
        </Card>
        
        <Link href="/admin/feedback">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats ? stats.feedback.avgRating.toFixed(1) : '...'}</div>
              <p className="text-xs text-muted-foreground">
                {stats ? `${stats.feedback.total} responses` : 'Loading...'}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* User Profile Distribution */}
      {stats && Object.keys(stats.userProfiles).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Profile Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.userProfiles).map(([role, count]) => (
                <div key={role} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{role}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold capitalize ${stats ? getStatusColor(stats.systemStatus) : 'text-gray-400'}`}>
              {stats ? stats.systemStatus : 'Loading...'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats ? `Last updated: ${new Date(stats.lastUpdated).toLocaleString()}` : 'Loading...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Extraction Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && Object.keys(stats.extractionJobs).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(stats.extractionJobs).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{status}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No extraction jobs found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/documents">
                <Button className="w-full justify-start" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Documents
                </Button>
              </Link>
              <Link href="/admin/sessions">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  View Sessions
                </Button>
              </Link>
              <Link href="/admin/feedback">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Star className="h-4 w-4 mr-2" />
                  View Feedback
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}