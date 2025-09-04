"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAdminApi } from '@/hooks/use-admin-api';
import { 
  Star,
  Search,
  RefreshCw,
  Calendar,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  ArrowLeft,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface FeedbackEntry {
  id: string;
  timestamp: string;
  ratings: {
    overall: number;
    helpfulness: number;
    accuracy: number;
    easeOfUse: number;
  };
  feedback: {
    specific: string;
    improvements: string;
    wouldRecommend: boolean;
  };
  userInfo: {
    email: string;
    role: string;
    name: string;
    sessionPhase: string;
  };
  sessionId: string;
  sessionCreated: string;
}

interface FeedbackAnalytics {
  averageRatings: {
    overall: number;
    helpfulness: number;
    accuracy: number;
    easeOfUse: number;
  };
  recommendations: {
    yes: number;
    no: number;
  };
  ratingDistribution: Array<{
    rating: number;
    count: number;
  }>;
  totalResponses: number;
}

interface FeedbackData {
  feedback: FeedbackEntry[];
  analytics: FeedbackAnalytics;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    period: number;
  };
}

export default function AdminFeedbackPage() {
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('30');
  const { authenticatedFetch } = useAdminApi();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null);
  const pageSize = 20;

  const fetchFeedback = async (page: number = 1, periodDays: string = '30') => {
    setLoading(true);
    setError(null);
    
    const offset = (page - 1) * pageSize;
    const params = new URLSearchParams({
      limit: pageSize.toString(),
      offset: offset.toString(),
      period: periodDays
    });
    
    try {
      const response = await authenticatedFetch(`/api/admin/feedback?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch feedback');
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback(currentPage, period);
  }, [currentPage, period]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchFeedback(currentPage, period);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderStars = (rating: number, size: string = 'h-4 w-4') => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`${size} ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm">({rating}/5)</span>
      </div>
    );
  };

  const getRecommendationPercentage = () => {
    if (!data?.analytics?.recommendations) return 0;
    const total = data.analytics.recommendations.yes + data.analytics.recommendations.no;
    return total > 0 ? Math.round((data.analytics.recommendations.yes / total) * 100) : 0;
  };

  const filteredFeedback = data?.feedback.filter(feedback =>
    searchTerm === '' || 
    feedback.userInfo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.userInfo.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.feedback.specific?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (selectedFeedback) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            onClick={() => setSelectedFeedback(null)} 
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feedback List
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Feedback Details</h1>
          <p className="text-gray-600">Submitted {formatDate(selectedFeedback.timestamp)}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Ratings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">Overall Experience:</span>
                <div className="mt-1">
                  {renderStars(selectedFeedback.ratings.overall)}
                </div>
              </div>
              <div>
                <span className="font-medium">Helpfulness:</span>
                <div className="mt-1">
                  {renderStars(selectedFeedback.ratings.helpfulness)}
                </div>
              </div>
              <div>
                <span className="font-medium">Accuracy:</span>
                <div className="mt-1">
                  {renderStars(selectedFeedback.ratings.accuracy)}
                </div>
              </div>
              <div>
                <span className="font-medium">Ease of Use:</span>
                <div className="mt-1">
                  {renderStars(selectedFeedback.ratings.easeOfUse)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">Name:</span> {selectedFeedback.userInfo.name || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Email:</span> {selectedFeedback.userInfo.email || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Role:</span> {selectedFeedback.userInfo.role || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Session Phase:</span> {selectedFeedback.userInfo.sessionPhase || 'N/A'}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Would Recommend:</span>
                {selectedFeedback.feedback.wouldRecommend ? (
                  <Badge className="bg-green-100 text-green-800">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Yes
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <ThumbsDown className="h-3 w-3 mr-1" />
                    No
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Written Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedFeedback.feedback.specific && (
                <div>
                  <h4 className="font-medium mb-2">Specific Feedback:</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedFeedback.feedback.specific}
                  </p>
                </div>
              )}
              {selectedFeedback.feedback.improvements && (
                <div>
                  <h4 className="font-medium mb-2">Improvement Suggestions:</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedFeedback.feedback.improvements}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
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
          <h1 className="text-3xl font-bold mb-2">Feedback Analytics</h1>
          <p className="text-gray-600">Monitor user feedback and satisfaction</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Analytics Overview */}
      {data?.analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.analytics?.averageRatings?.overall?.toFixed(1) || '0.0'}
              </div>
              <p className="text-xs text-muted-foreground">Out of 5.0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.analytics?.totalResponses || 0}</div>
              <p className="text-xs text-muted-foreground">In last {period} days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Would Recommend</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getRecommendationPercentage()}%
              </div>
              <p className="text-xs text-muted-foreground">
                {data?.analytics?.recommendations?.yes || 0} of {(data?.analytics?.recommendations?.yes || 0) + (data?.analytics?.recommendations?.no || 0)} users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Helpfulness</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.analytics?.averageRatings?.helpfulness?.toFixed(1) || '0.0'}
              </div>
              <p className="text-xs text-muted-foreground">Average helpfulness rating</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Distribution */}
      {data?.analytics?.ratingDistribution && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Rating Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = data?.analytics?.ratingDistribution?.find(r => r.rating === rating)?.count || 0;
                const percentage = (data?.analytics?.totalResponses || 0) > 0 ? (count / (data?.analytics?.totalResponses || 1)) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <div className="w-12 flex items-center gap-1">
                      <span className="text-sm">{rating}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-sm text-gray-600 text-right">
                      {count} ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search feedback by user, email, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative w-48">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <select 
            value={period} 
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading feedback...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-medium">Error loading feedback</h3>
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
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Overall Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Recommend</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Session Phase</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedback.map((feedback) => (
                    <tr key={feedback.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{feedback.userInfo.name || 'Anonymous'}</div>
                          <div className="text-sm text-gray-500">{feedback.userInfo.email}</div>
                          <div className="text-xs text-gray-400">{feedback.userInfo.role}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {renderStars(feedback.ratings.overall, 'h-3 w-3')}
                      </td>
                      <td className="py-3 px-4">
                        {feedback.feedback.wouldRecommend ? (
                          <Badge className="bg-green-100 text-green-800">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            No
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {feedback.userInfo.sessionPhase?.replace('_', ' ') || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {formatDate(feedback.timestamp)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          onClick={() => setSelectedFeedback(feedback)}
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
                Showing {filteredFeedback.length} of {data?.pagination?.total || 0} feedback entries
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