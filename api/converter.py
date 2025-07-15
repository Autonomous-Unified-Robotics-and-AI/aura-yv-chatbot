"""
AI SDK to Secure Backend Converter
Converts AI SDK chat requests to secure backend format
"""

import json
import httpx
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI()

class Message(BaseModel):
    role: str
    content: str

class AISDKRequest(BaseModel):
    messages: List[Message]

SECURE_BACKEND_URL = "http://localhost:8000"
active_sessions = {}  # Simple in-memory session store

@app.post("/api/chat")
async def convert_chat_request(request: AISDKRequest):
    """Convert AI SDK format to secure backend format"""
    print(f"DEBUG: Received AI SDK request: {request}")
    
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided")
    
    # Get the latest user message
    latest_message = request.messages[-1]
    if latest_message.role != "user":
        raise HTTPException(status_code=400, detail="Latest message must be from user")
    
    # Create or get session - for now, we'll create a new one each time
    # In production, you'd want to maintain session state
    try:
        async with httpx.AsyncClient() as client:
            # Create a new session
            session_response = await client.post(
                f"{SECURE_BACKEND_URL}/api/sessions",
                json={"user_info": {}},
                headers={"Content-Type": "application/json"},
                timeout=30.0
            )
            
            if session_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to create session")
            
            session_data = session_response.json()
            session_id = session_data["session_id"]
            
            # Send message to secure backend
            chat_response = await client.post(
                f"{SECURE_BACKEND_URL}/api/chat",
                json={
                    "session_id": session_id,
                    "message": latest_message.content
                },
                headers={"Content-Type": "application/json"},
                timeout=30.0
            )
            
            if chat_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to get response from secure backend")
            
            backend_data = chat_response.json()
            response_text = backend_data.get("response", "")
            
            # Convert to AI SDK streaming format
            def generate_stream():
                # Stream the response text
                yield f'0:{json.dumps(response_text)}\n'
                # End the stream
                yield f'e:{{"finishReason":"stop","usage":{{"promptTokens":0,"completionTokens":0}},"isContinued":false}}\n'
            
            return StreamingResponse(
                generate_stream(),
                media_type="text/plain",
                headers={'x-vercel-ai-data-stream': 'v1'}
            )
            
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "AI SDK Converter"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)