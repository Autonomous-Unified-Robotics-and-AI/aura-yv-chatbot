"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  MessageSquare,
  Star,
  Clock,
  Eye,
  ArrowLeft,
  Activity,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  department: string;
  affiliation: string;
}

interface VentureInfo {
  stage: string;
  primaryNeed: string;
  urgencyLevel: string;
  startupStage: string;
}

interface ExtractedData {
  name: string;
  email: string;
  role: string;
  department: string;
}

interface Session {
  id: string;
  sessionId: string;
  createdAt: string;
  lastActivity: string;
  phase: string;
  completionRate: number;
  userProfile: UserProfile;
  extractedData: ExtractedData;
  ventureInfo: VentureInfo;
  messageCount: number;
  lastMessage: string;
  hasRagMessages: boolean;
  latestFeedback: {
    overallRating: number;
    timestamp: string;
  } | null;
}

interface SessionsData {
  sessions: Session[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function AdminSessionsPage() {
  const [data, setData] = useState<SessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const pageSize = 20;

  const fetchSessions = async (page: number = 1, status: string = 'all') => {
    setLoading(true);
    setError(null);
    
    const offset = (page - 1) * pageSize;
    const params = new URLSearchParams({
      limit: pageSize.toString(),
      offset: offset.toString()
    });
    
    if (status !== 'all') {
      params.append('status', status);
    }
    
    try {
      const response = await fetch(`/api/admin/sessions?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch sessions');
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(currentPage, statusFilter);
  }, [currentPage, statusFilter]);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchSessions(currentPage, statusFilter);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPhaseColor = (phase: string) => {
    switch (phase?.toLowerCase()) {
      case 'profile_setup': return 'bg-blue-100 text-blue-800';
      case 'venture_discovery': return 'bg-yellow-100 text-yellow-800';
      case 'consultation': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredSessions = data?.sessions.filter(session =>
    searchTerm === '' || 
    session.userProfile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.userProfile.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.sessionId.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (selectedSession) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            onClick={() => setSelectedSession(null)} 
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Session Details</h1>
          <p className="text-gray-600">Session ID: {selectedSession.sessionId}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">Name:</span> {selectedSession.userProfile.name || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Email:</span> {selectedSession.userProfile.email || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Role:</span> {selectedSession.userProfile.role || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Department:</span> {selectedSession.userProfile.department || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Affiliation:</span> {selectedSession.userProfile.affiliation || 'N/A'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Session Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Phase:</span>
                <Badge className={getPhaseColor(selectedSession.phase)}>
                  {selectedSession.phase?.replace('_', ' ') || 'Unknown'}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Completion:</span>
                <span className={`ml-2 font-bold ${getCompletionColor(selectedSession.completionRate)}`}>
                  {selectedSession.completionRate}%
                </span>
              </div>
              <div>
                <span className="font-medium">Created:</span> {formatDate(selectedSession.createdAt)}
              </div>
              <div>
                <span className="font-medium">Last Activity:</span> {formatDate(selectedSession.lastActivity)}
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>{selectedSession.messageCount} messages</span>
                {selectedSession.hasRagMessages && (
                  <Badge variant="secondary">RAG Used</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedSession.ventureInfo.stage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Venture Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium">Stage:</span> {selectedSession.ventureInfo.stage}
                </div>
                <div>
                  <span className="font-medium">Primary Need:</span> {selectedSession.ventureInfo.primaryNeed || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Urgency Level:</span> {selectedSession.ventureInfo.urgencyLevel || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Startup Stage:</span> {selectedSession.ventureInfo.startupStage || 'N/A'}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedSession.latestFeedback && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Latest Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < selectedSession.latestFeedback!.overallRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="ml-2 text-sm">({selectedSession.latestFeedback.overallRating}/5)</span>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Submitted:</span> {formatDate(selectedSession.latestFeedback.timestamp)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">User Sessions</h1>
          <p className="text-gray-600">Manage and monitor user sessions</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, email, or session ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative w-48">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <select 
            value={statusFilter} 
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Sessions</option>
            <option value="active">Active (24h)</option>
            <option value="recent">Recent (7d)</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading sessions...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-medium">Error loading sessions</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button onClick={handleRefresh} className="mt-3" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="bg-white rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Phase</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Progress</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Messages</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Last Activity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{session.userProfile.name || 'Anonymous'}</div>
                          <div className="text-sm text-gray-500">{session.userProfile.email}</div>
                          <div className="text-xs text-gray-400">{session.userProfile.role}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getPhaseColor(session.phase)}>
                          {session.phase?.replace('_', ' ') || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${getCompletionColor(session.completionRate)}`}>
                          {session.completionRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-400" />
                          <span>{session.messageCount}</span>
                          {session.hasRagMessages && (
                            <Badge variant="secondary" className="text-xs">RAG</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-3 w-3" />
                          {formatDate(session.lastActivity)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {session.latestFeedback ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span>{session.latestFeedback.overallRating}/5</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No feedback</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          onClick={() => setSelectedSession(session)}
                          size="sm" 
                          variant="outline"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredSessions.length} of {data?.pagination?.total || 0} sessions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {Math.ceil((data?.pagination?.total || 0) / pageSize)}
                </span>
                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!data?.pagination?.hasMore}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}