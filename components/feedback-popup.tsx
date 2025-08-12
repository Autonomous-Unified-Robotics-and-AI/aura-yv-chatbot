"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { X, Send, Star } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
}

interface FeedbackData {
  overall_rating: number;
  helpfulness_rating: number;
  accuracy_rating: number;
  ease_of_use_rating: number;
  specific_feedback: string;
  improvement_suggestions: string;
  would_recommend: boolean;
  email?: string;
}

export function FeedbackPopup({ isOpen, onClose, sessionId }: FeedbackPopupProps) {
  const [formData, setFormData] = useState<FeedbackData>({
    overall_rating: 0,
    helpfulness_rating: 0,
    accuracy_rating: 0,
    ease_of_use_rating: 0,
    specific_feedback: '',
    improvement_suggestions: '',
    would_recommend: false,
    email: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const backendUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000' 
    : '';

  // Validation function to check if form is ready for submission
  const isFormValid = () => {
    return formData.overall_rating > 0;
  };

  // Get validation errors for display
  const getValidationErrors = () => {
    const errors = [];
    if (formData.overall_rating === 0) {
      errors.push("Overall rating is required");
    }
    return errors;
  };

  const StarRating = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (rating: number) => void; 
    label: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double-check validation
    if (!isFormValid()) {
      const errors = getValidationErrors();
      toast.error(errors[0]); // Show the first error
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${backendUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          session_id: sessionId,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast.success("Thank you for your feedback!");
        setTimeout(() => {
          onClose();
          setIsSubmitted(false);
          // Reset form
          setFormData({
            overall_rating: 0,
            helpfulness_rating: 0,
            accuracy_rating: 0,
            ease_of_use_rating: 0,
            specific_feedback: '',
            improvement_suggestions: '',
            would_recommend: false,
            email: ''
          });
        }, 2000);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Share Your Feedback
            </CardTitle>
            <CardDescription>
              Help us improve the Yale Ventures AI Assistant
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="text-green-600 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
              <p className="text-gray-600">Your feedback has been submitted successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Overall Rating */}
              <div className={`space-y-2 ${formData.overall_rating === 0 ? 'ring-2 ring-red-200 rounded-md p-3 bg-red-50/50' : ''}`}>
                <StarRating
                  value={formData.overall_rating}
                  onChange={(rating) => setFormData({ ...formData, overall_rating: rating })}
                  label="Overall Experience *"
                />
                {formData.overall_rating === 0 && (
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Please provide an overall rating
                  </p>
                )}
              </div>

              {/* Additional Ratings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StarRating
                  value={formData.helpfulness_rating}
                  onChange={(rating) => setFormData({ ...formData, helpfulness_rating: rating })}
                  label="Helpfulness"
                />
                <StarRating
                  value={formData.accuracy_rating}
                  onChange={(rating) => setFormData({ ...formData, accuracy_rating: rating })}
                  label="Accuracy"
                />
                <StarRating
                  value={formData.ease_of_use_rating}
                  onChange={(rating) => setFormData({ ...formData, ease_of_use_rating: rating })}
                  label="Ease of Use"
                />
              </div>

              {/* Recommendation */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Would you recommend this assistant to others?</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="recommend"
                      checked={formData.would_recommend === true}
                      onChange={() => setFormData({ ...formData, would_recommend: true })}
                      className="h-4 w-4"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="recommend"
                      checked={formData.would_recommend === false}
                      onChange={() => setFormData({ ...formData, would_recommend: false })}
                      className="h-4 w-4"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              {/* Specific Feedback */}
              <div className="space-y-2">
                <Label htmlFor="specific_feedback" className="text-sm font-medium">
                  What did you think of the responses you received?
                </Label>
                <Textarea
                  id="specific_feedback"
                  placeholder="Tell us about your experience with the AI assistant's responses..."
                  value={formData.specific_feedback}
                  onChange={(e) => setFormData({ ...formData, specific_feedback: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>

              {/* Improvement Suggestions */}
              <div className="space-y-2">
                <Label htmlFor="improvement_suggestions" className="text-sm font-medium">
                  How can we improve this assistant?
                </Label>
                <Textarea
                  id="improvement_suggestions"
                  placeholder="Any suggestions for improvements or additional features..."
                  value={formData.improvement_suggestions}
                  onChange={(e) => setFormData({ ...formData, improvement_suggestions: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>

              {/* Optional Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email (optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@yale.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  We may reach out for follow-up questions about your feedback
                </p>
              </div>

              {/* Validation Messages */}
              {!isFormValid() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Please complete required fields
                      </h3>
                      <div className="mt-1 text-sm text-yellow-700">
                        <ul className="list-disc pl-5 space-y-1">
                          {getValidationErrors().map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !isFormValid()}
                  className={!isFormValid() ? "opacity-50 cursor-not-allowed" : ""}
                  title={!isFormValid() ? "Please complete required fields before submitting" : "Submit your feedback"}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}