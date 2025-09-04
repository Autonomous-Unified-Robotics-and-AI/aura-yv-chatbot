"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Star } from 'lucide-react';
import { FeedbackPopup } from './feedback-popup';

interface FeedbackButtonProps {
  sessionId: string | null;
}

export function FeedbackButton({ sessionId }: FeedbackButtonProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <>
      {/* Floating Feedback Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsPopupOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group px-4 py-2 h-auto"
          size="sm"
        >
          <Star className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Share feedback</span>
        </Button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-gray-900 text-white text-sm px-3 py-1 rounded whitespace-nowrap">
            Share feedback
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>

      {/* Feedback Popup */}
      <FeedbackPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        sessionId={sessionId}
      />
    </>
  );
}