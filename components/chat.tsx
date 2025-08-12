"use client";

import { PreviewMessage, ThinkingMessage } from "@/components/message";
import { MultimodalInput } from "@/components/multimodal-input";
import { Overview } from "@/components/overview";
import { FeedbackButton } from "@/components/feedback-button";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { ToolInvocation } from "ai";
import { useChat } from "ai/react";
import { toast } from "sonner";
import { useState, useCallback, useEffect } from "react";

// Cookie utilities
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const setCookie = (name: string, value: string, days: number = 30) => {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  // Only add Secure flag for HTTPS
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? ';Secure' : '';
  const cookieString = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax${secureFlag}`;
  
  console.log("Setting cookie with string:", cookieString);
  document.cookie = cookieString;
  
  // Verify cookie was set with a small delay to ensure it's written
  setTimeout(() => {
    const verification = getCookie(name);
    console.log("Cookie verification - expected:", value, "actual:", verification);
  }, 100);
};

const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

export function Chat() {
  const chatId = "001";
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(null);
  const [showResetButton, setShowResetButton] = useState(false);

  // Check for existing session and cookie consent on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      console.log("=== INITIALIZING APP ===");
      console.log("All cookies:", document.cookie);
      
      // Check cookie consent first
      const consentValue = getCookie('cookie-consent');
      console.log("Cookie consent value found:", consentValue);
      
      if (consentValue) {
        // Only set consent state if user has previously made a choice
        const hasConsent = consentValue === 'accepted';
        console.log("Found existing consent, setting to:", hasConsent);
        setCookieConsent(hasConsent);
        
        if (hasConsent) {
          // Try to restore existing session from cookie
          const existingSessionId = getCookie('yale-ventures-session');
          console.log("Existing session ID from cookie:", existingSessionId);
          if (existingSessionId) {
            // Validate session is still active
            try {
              const response = await fetch(`/api/sessions/${existingSessionId}`);
              if (response.ok) {
                console.log("Restored existing session:", existingSessionId);
                setSessionId(existingSessionId);
                
                // Restore conversation history
                try {
                  const historyResponse = await fetch(`/api/sessions/${existingSessionId}/history`);
                  if (historyResponse.ok) {
                    const historyData = await historyResponse.json();
                    if (historyData.messages && historyData.messages.length > 0) {
                      setMessages(historyData.messages);
                      console.log("Restored conversation history:", historyData.messages.length, "messages");
                    }
                  }
                } catch (historyError) {
                  console.log("Failed to restore conversation history:", historyError);
                }
                
                return; // Exit early - don't create new session
              } else {
                // Session expired, remove cookie
                deleteCookie('yale-ventures-session');
              }
            } catch (error) {
              console.log("Session validation failed, creating new session");
              deleteCookie('yale-ventures-session');
            }
          }
          
          // Only create new session if user has consented and no valid session exists
          await createNewSession();
        }
      } else {
        console.log("No consent cookie found - banner should show");
        // Don't create a session yet - wait for user consent
      }
    };

    checkExistingSession();
  }, []);

  const createNewSession = async () => {
    try {
      console.log("Creating new session...");
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_agent: navigator.userAgent,
          initial_context: {}
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Session created:", data);
        setSessionId(data.session_id);
        
        // Note: Session will be auto-stored in cookie by useEffect if consent is given
        console.log("Session created, cookie consent status:", cookieConsent);
      } else {
        const errorText = await response.text();
        console.error("Session creation failed:", response.status, errorText);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleCookieConsent = async (accepted: boolean) => {
    console.log("=== HANDLING COOKIE CONSENT ===");
    console.log("Cookie consent given:", accepted);
    console.log("Before setting consent - all cookies:", document.cookie);
    
    setCookieConsent(accepted);
    setCookie('cookie-consent', accepted ? 'accepted' : 'declined', 365);
    console.log("Set cookie consent cookie to:", accepted ? 'accepted' : 'declined');
    
    // Verify the cookie was actually set
    setTimeout(() => {
      console.log("After setting consent - all cookies:", document.cookie);
      const verification = getCookie('cookie-consent');
      console.log("Cookie consent verification:", verification);
    }, 200);
    
    if (accepted) {
      // Store current session in cookie if we have one, otherwise create new session
      if (sessionId) {
        setCookie('yale-ventures-session', sessionId, 30);
        console.log("Stored existing session in cookie:", sessionId);
      } else {
        // Create new session since user just accepted cookies and we don't have one yet
        console.log("No session available - creating new session after consent");
        await createNewSession();
      }
    } else {
      // Remove session cookie if declined
      deleteCookie('yale-ventures-session');
      console.log("Deleted session cookie");
    }
  };

  const resetConversation = async () => {
    try {
      // Delete current session
      if (sessionId && cookieConsent) {
        deleteCookie('yale-ventures-session');
      }
      
      // Clear messages
      setMessages([]);
      setSessionId(null);
      
      // Create new session
      await createNewSession();
      
      console.log("Conversation reset successfully");
    } catch (error) {
      console.error("Failed to reset conversation:", error);
    }
  };

  const clearChat = async () => {
    try {
      console.log("Clearing chat - removing cookies and creating new session");
      
      // Clear messages from UI
      setMessages([]);
      
      // Remove session cookie (but keep database record intact)
      if (cookieConsent) {
        deleteCookie('yale-ventures-session');
        console.log("Removed session cookie");
      }
      
      // Reset session ID to trigger new session creation
      setSessionId(null);
      
      // Create a fresh session (this preserves the old session in the database)
      await createNewSession();
      
      console.log("Chat cleared successfully - new session started");
    } catch (error) {
      console.error("Failed to clear chat:", error);
      // Fallback: just clear messages if session creation fails
      setMessages([]);
    }
  };

  // Key combination to show reset button (Ctrl+Shift+R)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        setShowResetButton(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Effect to store session in cookie when both sessionId and consent are available
  useEffect(() => {
    if (sessionId && cookieConsent === true) {
      const existingSessionCookie = getCookie('yale-ventures-session');
      if (!existingSessionCookie || existingSessionCookie !== sessionId) {
        setCookie('yale-ventures-session', sessionId, 30);
        console.log("Auto-stored session in cookie after consent:", sessionId);
      }
    }
  }, [sessionId, cookieConsent]);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
  } = useChat({
    fetch: async (url, init) => {
      const body = JSON.parse(init?.body as string || '{}');
      const lastMessage = body.messages?.[body.messages.length - 1];
      
      if (lastMessage) {
        // Wait for session to be created if it's not ready yet
        if (!sessionId) {
          console.log("Session not ready, waiting...");
          toast.error("Session not ready. Please wait a moment and try again.");
          throw new Error("Session not ready");
        }
        
        console.log("Using session:", sessionId);
        
        // Convert AI SDK format to backend format
        const backendBody = {
          session_id: sessionId,
          message: lastMessage.content
        };
        
        console.log("Sending request:", backendBody);
        
        const backendUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8000' 
          : '';
        
        const response = await fetch(`${backendUrl}/api/chat`, {
          ...init,
          body: JSON.stringify(backendBody)
        });
        
        console.log("Response status:", response.status);
        
        if (response.ok) {
          // Check if response is already streaming (has the right content-type)
          const contentType = response.headers.get('content-type');
          if (contentType === 'text/plain' && response.headers.get('x-vercel-ai-data-stream') === 'v1') {
            // Response is already in streaming format, pass it through
            console.log("Received streaming response from backend");
            return response;
          } else {
            // Fallback: convert JSON response to streaming format
            const data = await response.json();
            console.log("Response data:", data);
            
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
              start(controller) {
                // Send the content in the correct AI SDK format
                controller.enqueue(encoder.encode(`0:${JSON.stringify(data.response)}\n`));
                controller.enqueue(encoder.encode(`e:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0},"isContinued":false}\n`));
                controller.close();
              }
            });
            
            return new Response(stream, {
              headers: { 
                'content-type': 'text/plain',
                'x-vercel-ai-data-stream': 'v1' 
              }
            });
          }
        } else {
          const errorText = await response.text();
          console.error("API Error:", response.status, errorText);
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
      }
      
      return fetch(url, init);
    },
    maxSteps: 4,
    onError: (error) => {
      if (error.message.includes("Too many requests")) {
        toast.error(
          "You are sending too many messages. Please try again later.",
        );
      }
    },
  });

  const [messagesContainerRef, messagesEndRef, scrollToBottom] =
    useScrollToBottom<HTMLDivElement>();

  // Custom submit handler that scrolls to bottom when user sends a message
  const handleCustomSubmit = useCallback((
    event?: { preventDefault?: () => void },
    chatRequestOptions?: any
  ) => {
    handleSubmit(event, chatRequestOptions);
    // Scroll to bottom when user sends a message
    setTimeout(() => scrollToBottom(), 100);
  }, [handleSubmit, scrollToBottom]);

  return (
    <div className="flex flex-col min-w-0 h-[calc(100dvh-52px)] bg-background relative">
      {/* Cookie Consent Banner */}
      {cookieConsent === null && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              <p>
                We use cookies to remember your conversation and improve your experience. 
                <span className="font-medium"> No personal data is stored or shared.</span>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleCookieConsent(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Decline
              </button>
              <button
                onClick={() => handleCookieConsent(true)}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Reset Button (Ctrl+Shift+R to toggle) */}
      {showResetButton && (
        <div className="fixed top-4 right-4 z-40">
          <button
            onClick={resetConversation}
            className="px-3 py-2 text-xs bg-red-600 text-white rounded-md shadow-lg hover:bg-red-700 transition-colors"
            title="Reset conversation (for testing)"
          >
            Reset Chat
          </button>
        </div>
      )}

      <div
        ref={messagesContainerRef}
        className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative"
      >
        {messages.length === 0 && <Overview />}

        {/* Clear Chat Button - shown when there are messages */}
        {messages.length > 0 && (
          <div className="absolute top-4 right-4 z-30">
            <button
              onClick={clearChat}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 flex items-center gap-2"
              title="Clear conversation"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Chat
            </button>
          </div>
        )}

        {messages.map((message, index) => (
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            isLoading={isLoading && messages.length - 1 === index}
          />
        ))}

        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && <ThinkingMessage />}

        <div
          ref={messagesEndRef}
          className="shrink-0 min-w-[24px] min-h-[24px]"
        />
      </div>

      <form className={`flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl ${cookieConsent === null ? 'mb-20' : ''}`}>
        <MultimodalInput
          chatId={chatId}
          input={input}
          setInput={setInput}
          handleSubmit={handleCustomSubmit}
          isLoading={isLoading}
          stop={stop}
          messages={messages}
          setMessages={setMessages}
          append={append}
        />
      </form>
      
      {/* AI Disclaimer */}
      <div className="text-center px-4 pb-4 text-xs text-muted-foreground max-w-3xl mx-auto">
        <p>
          AI can make mistakes. Please verify important information and consult with Yale Ventures directly for official guidance. 
          Information provided is for reference only and may not reflect current programs or requirements.
        </p>
      </div>
      
      {/* Feedback Button - Fixed positioning in lower right corner */}
      <FeedbackButton sessionId={sessionId} />
    </div>
  );
}
