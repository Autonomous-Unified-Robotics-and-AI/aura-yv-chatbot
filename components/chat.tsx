"use client";

import { PreviewMessage, ThinkingMessage } from "@/components/message";
import { MultimodalInput } from "@/components/multimodal-input";
import { Overview } from "@/components/overview";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { ToolInvocation } from "ai";
import { useChat } from "ai/react";
import { toast } from "sonner";
import { useState, useCallback, useEffect } from "react";

export function Chat() {
  const chatId = "001";
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Create session on component mount
  useEffect(() => {
    const createSession = async () => {
      try {
        console.log("Creating session...");
        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_agent: navigator.userAgent,
            initial_context: {}
          })
        });
        
        console.log("Session creation response:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Session created:", data);
          setSessionId(data.session_id);
        } else {
          const errorText = await response.text();
          console.error("Session creation failed:", response.status, errorText);
        }
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    };
    
    createSession();
  }, []);

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
          throw new Error("Session not ready");
        }
        
        // Convert AI SDK format to backend format
        const backendBody = {
          session_id: sessionId,
          message: lastMessage.content
        };
        
        console.log("Sending request:", backendBody);
        
        const response = await fetch("/api/chat", {
          ...init,
          body: JSON.stringify(backendBody)
        });
        
        console.log("Response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Response data:", data);
          
          // Convert backend response to AI SDK streaming format
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
    <div className="flex flex-col min-w-0 h-[calc(100dvh-52px)] bg-background">
      <div
        ref={messagesContainerRef}
        className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
      >
        {messages.length === 0 && <Overview />}

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

      <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
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
    </div>
  );
}
