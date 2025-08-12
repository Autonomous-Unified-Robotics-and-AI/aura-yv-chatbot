"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Download, 
  RefreshCw,
  Clock,
  Mail,
  GraduationCap,
  Building2,
  Lightbulb,
  Star
} from 'lucide-react';

interface UserData {
  session_id: string;
  created_at: string;
  messages: Array<{
    timestamp: string;
    user_message: string;
    bot_response: string;
    phase: string;
  }>;
  collected_data: {
    name?: string;
    email?: string;
    role?: string;
    department?: string;
    startup_stage?: string;
  };
  phase: string;
  last_activity: string;
}

interface AdminStats {
  total_sessions: number;
  active_sessions: number;
  total_messages: number;
  data_collection_rate: number;
  top_user_needs: Array<{
    need: string;
    count: number;
  }>;
}

interface FeedbackData {
  id: string;
  session_id: string | null;
  overall_rating: number;
  helpfulness_rating: number;
  accuracy_rating: number;
  ease_of_use_rating: number;
  specific_feedback: string;
  improvement_suggestions: string;
  would_recommend: boolean;
  email?: string;
  timestamp: string;
}

interface AdminDashboardProps {
  token: string;
  onSignOut: () => void;
}

export function AdminDashboard({ token, onSignOut }: AdminDashboardProps) {
  const [userData, setUserData] = useState<UserData[]>([]);
  const [feedbackData, setFeedbackData] = useState<FeedbackData[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const backendUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '';

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch user data, stats, and feedback in parallel
      const [userResponse, statsResponse, feedbackResponse] = await Promise.all([
        fetch(`${backendUrl}/api/admin/user-data`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${backendUrl}/api/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/admin/feedback`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!userResponse.ok || !statsResponse.ok) {
        if (userResponse.status === 401 || statsResponse.status === 401 || feedbackResponse.status === 401) {
          onSignOut();
          return;
        }
        throw new Error('Failed to fetch data');
      }

      const userDataResult = await userResponse.json();
      const statsResult = await statsResponse.json();
      
      // Feedback might fail if not implemented in backend yet
      let feedbackResult = [];
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        feedbackResult = feedbackData.feedback || [];
      }

      setUserData(userDataResult.data);
      setStats(statsResult);
      setFeedbackData(feedbackResult);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/export?format=${format}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Export failed');

      const data = await response.json();
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yale-ventures-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([data.csv_data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yale-ventures-data-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Export failed');
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'welcome_data_collection': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'assessment_guidance': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'guidance_completion': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading && !userData.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin mb-4" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Yale Ventures Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: {formatDate(lastRefresh.toISOString())}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={onSignOut} variant="destructive">
              Sign Out
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sessions</p>
                    <p className="text-3xl font-bold">{stats.total_sessions}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Messages</p>
                    <p className="text-3xl font-bold">{stats.total_messages}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Data Collection Rate</p>
                    <p className="text-3xl font-bold">{Math.round(stats.data_collection_rate * 100)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sessions</p>
                    <p className="text-3xl font-bold">{stats.active_sessions}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">User Data</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* User Data Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Sessions ({userData.length})</CardTitle>
                <CardDescription>
                  Detailed view of all user interactions and collected data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userData.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No user data collected yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userData.map((user) => (
                      <Card key={user.session_id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className={getPhaseColor(user.phase)}>
                                  {user.phase.replace(/_/g, ' ')}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {user.session_id}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {user.collected_data.name && (
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">{user.collected_data.name}</span>
                                  </div>
                                )}
                                {user.collected_data.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">{user.collected_data.email}</span>
                                  </div>
                                )}
                                {user.collected_data.role && (
                                  <div className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm capitalize">{user.collected_data.role}</span>
                                  </div>
                                )}
                                {user.collected_data.department && (
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">{user.collected_data.department}</span>
                                  </div>
                                )}
                                {user.collected_data.startup_stage && (
                                  <div className="flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm capitalize">{user.collected_data.startup_stage}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-sm text-gray-600">
                                <p><strong>Created:</strong> {formatDate(user.created_at)}</p>
                                <p><strong>Last Activity:</strong> {formatDate(user.last_activity)}</p>
                                <p><strong>Messages:</strong> {user.messages.length}</p>
                              </div>
                            </div>
                            
                            <div className="lg:w-1/3">
                              <p className="text-sm font-medium mb-2">Latest Message:</p>
                              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                                {user.messages.length > 0 ? (
                                  <p className="line-clamp-3">
                                    {user.messages[user.messages.length - 1].user_message}
                                  </p>
                                ) : (
                                  <p className="text-gray-500">No messages yet</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>User Feedback ({feedbackData.length})</CardTitle>
                <CardDescription>
                  Feedback and ratings from users about the AI assistant
                </CardDescription>
              </CardHeader>
              <CardContent>
                {feedbackData.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No feedback collected yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Feedback Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="bg-blue-50 dark:bg-blue-900/20">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {feedbackData.length > 0 
                                ? (feedbackData.reduce((acc, f) => acc + f.overall_rating, 0) / feedbackData.length).toFixed(1)
                                : '0.0'
                              }
                            </p>
                            <p className="text-xs text-gray-500">out of 5</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 dark:bg-green-900/20">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Would Recommend</p>
                            <p className="text-2xl font-bold text-green-600">
                              {feedbackData.length > 0 
                                ? Math.round((feedbackData.filter(f => f.would_recommend).length / feedbackData.length) * 100)
                                : 0
                              }%
                            </p>
                            <p className="text-xs text-gray-500">{feedbackData.filter(f => f.would_recommend).length} of {feedbackData.length}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-50 dark:bg-purple-900/20">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Helpfulness</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {feedbackData.length > 0 
                                ? (feedbackData.reduce((acc, f) => acc + (f.helpfulness_rating || 0), 0) / feedbackData.length).toFixed(1)
                                : '0.0'
                              }
                            </p>
                            <p className="text-xs text-gray-500">average rating</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-orange-50 dark:bg-orange-900/20">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">With Comments</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {feedbackData.filter(f => f.specific_feedback.trim() !== '').length}
                            </p>
                            <p className="text-xs text-gray-500">detailed feedback</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Individual Feedback Items */}
                    <div className="space-y-4">
                      {feedbackData
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((feedback) => (
                        <Card key={feedback.id} className="border-l-4 border-l-yellow-400">
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              {/* Header */}
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-4 w-4 ${
                                            star <= feedback.overall_rating
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                      <span className="ml-2 text-sm font-medium">
                                        {feedback.overall_rating}/5
                                      </span>
                                    </div>
                                    {feedback.would_recommend && (
                                      <Badge className="bg-green-100 text-green-800 text-xs">
                                        Would Recommend
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(feedback.timestamp)}
                                    {feedback.session_id && (
                                      <span className="ml-2">• Session: {feedback.session_id}</span>
                                    )}
                                    {feedback.email && (
                                      <span className="ml-2">• {feedback.email}</span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Detailed Ratings */}
                              {(feedback.helpfulness_rating > 0 || feedback.accuracy_rating > 0 || feedback.ease_of_use_rating > 0) && (
                                <div className="grid grid-cols-3 gap-4">
                                  {feedback.helpfulness_rating > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-gray-600">Helpfulness</p>
                                      <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`h-3 w-3 ${
                                              star <= feedback.helpfulness_rating
                                                ? 'fill-blue-400 text-blue-400'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                        <span className="text-xs ml-1">{feedback.helpfulness_rating}/5</span>
                                      </div>
                                    </div>
                                  )}
                                  {feedback.accuracy_rating > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-gray-600">Accuracy</p>
                                      <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`h-3 w-3 ${
                                              star <= feedback.accuracy_rating
                                                ? 'fill-green-400 text-green-400'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                        <span className="text-xs ml-1">{feedback.accuracy_rating}/5</span>
                                      </div>
                                    </div>
                                  )}
                                  {feedback.ease_of_use_rating > 0 && (
                                    <div>
                                      <p className="text-xs font-medium text-gray-600">Ease of Use</p>
                                      <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`h-3 w-3 ${
                                              star <= feedback.ease_of_use_rating
                                                ? 'fill-purple-400 text-purple-400'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                        <span className="text-xs ml-1">{feedback.ease_of_use_rating}/5</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Feedback Text */}
                              {feedback.specific_feedback.trim() !== '' && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Feedback:</p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                    {feedback.specific_feedback}
                                  </p>
                                </div>
                              )}

                              {/* Improvement Suggestions */}
                              {feedback.improvement_suggestions.trim() !== '' && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Suggestions for Improvement:</p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                                    {feedback.improvement_suggestions}
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              {stats && stats.top_user_needs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top User Needs</CardTitle>
                    <CardDescription>
                      Most frequently mentioned needs and interests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.top_user_needs.map((need, index) => (
                        <div key={need.need} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                            <span className="capitalize">{need.need}</span>
                          </div>
                          <Badge variant="secondary">{need.count} mentions</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle>Data Collection Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Users with names collected</span>
                      <span>{userData.filter(u => u.collected_data.name).length}/{userData.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Users with emails collected</span>
                      <span>{userData.filter(u => u.collected_data.email).length}/{userData.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Users with roles identified</span>
                      <span>{userData.filter(u => u.collected_data.role).length}/{userData.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Users with startup stage identified</span>
                      <span>{userData.filter(u => u.collected_data.startup_stage).length}/{userData.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>
                  Download collected user data in various formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => exportData('json')} 
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export as JSON
                  </Button>
                  <Button 
                    onClick={() => exportData('csv')} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export as CSV
                  </Button>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>JSON:</strong> Complete data with all messages and metadata</p>
                  <p><strong>CSV:</strong> Summary data suitable for spreadsheet analysis</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}