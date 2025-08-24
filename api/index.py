import os
import json
from typing import List
from openai.types.chat.chat_completion_message_param import ChatCompletionMessageParam
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import FastAPI, Query, HTTPException, Request as FastAPIRequest
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from openai import OpenAI
from .utils.prompt import ClientMessage, convert_to_openai_messages
from .utils.tools import get_current_weather


load_dotenv(".env")

app = FastAPI()

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: FastAPIRequest, exc: RequestValidationError):
    body = await request.body()
    print(f"VALIDATION ERROR: {exc.errors()}")
    print(f"REQUEST BODY: {body}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": body.decode()}
    )

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)


class Request(BaseModel):
    messages: List[ClientMessage] = []
    message: str = ""
    session_id: str = ""
    
    @property
    def get_message_content(self) -> str:
        """Extract message content from either format"""
        if self.message:
            return self.message
        elif self.messages and len(self.messages) > 0:
            return self.messages[-1].content
        return ""


available_tools = {
    "get_current_weather": get_current_weather,
}

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/sessions")
async def create_session():
    import uuid
    session_id = f"sess_{uuid.uuid4().hex[:12]}"
    return {"session_id": session_id}

def do_stream(messages: List[ChatCompletionMessageParam]):
    stream = client.chat.completions.create(
        messages=messages,
        model="gpt-4o",
        stream=True,
        tools=[{
            "type": "function",
            "function": {
                "name": "get_current_weather",
                "description": "Get the current weather at a location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "latitude": {
                            "type": "number",
                            "description": "The latitude of the location",
                        },
                        "longitude": {
                            "type": "number",
                            "description": "The longitude of the location",
                        },
                    },
                    "required": ["latitude", "longitude"],
                },
            },
        }]
    )

    return stream

def stream_text(messages: List[ChatCompletionMessageParam], protocol: str = 'data'):
    draft_tool_calls = []
    draft_tool_calls_index = -1

    stream = client.chat.completions.create(
        messages=messages,
        model="gpt-4o",
        stream=True,
        tools=[{
            "type": "function",
            "function": {
                "name": "get_current_weather",
                "description": "Get the current weather at a location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "latitude": {
                            "type": "number",
                            "description": "The latitude of the location",
                        },
                        "longitude": {
                            "type": "number",
                            "description": "The longitude of the location",
                        },
                    },
                    "required": ["latitude", "longitude"],
                },
            },
        }]
    )

    for chunk in stream:
        for choice in chunk.choices:
            if choice.finish_reason == "stop":
                continue

            elif choice.finish_reason == "tool_calls":
                for tool_call in draft_tool_calls:
                    yield '9:{{"toolCallId":"{id}","toolName":"{name}","args":{args}}}\n'.format(
                        id=tool_call["id"],
                        name=tool_call["name"],
                        args=tool_call["arguments"])

                for tool_call in draft_tool_calls:
                    tool_result = available_tools[tool_call["name"]](
                        **json.loads(tool_call["arguments"]))

                    yield 'a:{{"toolCallId":"{id}","toolName":"{name}","args":{args},"result":{result}}}\n'.format(
                        id=tool_call["id"],
                        name=tool_call["name"],
                        args=tool_call["arguments"],
                        result=json.dumps(tool_result))

            elif choice.delta.tool_calls:
                for tool_call in choice.delta.tool_calls:
                    id = tool_call.id
                    name = tool_call.function.name
                    arguments = tool_call.function.arguments

                    if (id is not None):
                        draft_tool_calls_index += 1
                        draft_tool_calls.append(
                            {"id": id, "name": name, "arguments": ""})

                    else:
                        draft_tool_calls[draft_tool_calls_index]["arguments"] += arguments

            else:
                yield '0:{text}\n'.format(text=json.dumps(choice.delta.content))

        if chunk.choices == []:
            usage = chunk.usage
            prompt_tokens = usage.prompt_tokens
            completion_tokens = usage.completion_tokens

            yield 'e:{{"finishReason":"{reason}","usage":{{"promptTokens":{prompt},"completionTokens":{completion}}},"isContinued":false}}\n'.format(
                reason="tool-calls" if len(
                    draft_tool_calls) > 0 else "stop",
                prompt=prompt_tokens,
                completion=completion_tokens
            )




@app.post("/api/chat")
async def handle_chat_data(request: Request, protocol: str = Query('data')):
    print(f"DEBUG: Received request - messages: {request.messages}, message: {request.message}, session_id: {request.session_id}")
    
    try:
        import httpx
        
        # Check if we should use the secure backend
        backend_url = os.environ.get("BACKEND_URL")
        
        if backend_url:
            try:
                async with httpx.AsyncClient() as client:
                    # Get the message content using the property
                    message_content = request.get_message_content
                    
                    if not message_content:
                        raise ValueError("No message provided")
                    
                    # Check if we have a session_id in the request or need to create one
                    session_id = request.session_id
                    
                    if not session_id:
                        # Create a new session
                        session_response = await client.post(
                            f"{backend_url}/sessions",
                            json={},
                            headers={"Content-Type": "application/json"},
                            timeout=30.0
                        )
                        if session_response.status_code == 200:
                            session_data = session_response.json()
                            session_id = session_data.get("session_id")
                        else:
                            raise ValueError("Failed to create session")
                    
                    # Send message to secure backend
                    chat_response = await client.post(
                        f"{backend_url}/chat",
                        json={
                            "session_id": session_id,
                            "message": message_content
                        },
                        headers={"Content-Type": "application/json"},
                        timeout=30.0
                    )
                    
                    # If session not found, create a new session and retry
                    if chat_response.status_code == 404:
                        try:
                            # Create a new session
                            session_response = await client.post(
                                f"{backend_url}/sessions",
                                json={},
                                headers={"Content-Type": "application/json"},
                                timeout=30.0
                            )
                            if session_response.status_code == 200:
                                session_data = session_response.json()
                                new_session_id = session_data.get("session_id")
                                
                                # Retry with new session
                                chat_response = await client.post(
                                    f"{backend_url}/chat",
                                    json={
                                        "session_id": new_session_id,
                                        "message": message_content
                                    },
                                    headers={"Content-Type": "application/json"},
                                    timeout=30.0
                                )
                        except Exception as retry_error:
                            print(f"Error creating new session: {retry_error}")
                            # Fall back to original implementation
                            raise Exception("Backend session retry failed")
                    
                    if chat_response.status_code == 200:
                        backend_data = chat_response.json()
                        response_text = backend_data.get("response", "")
                        
                        # Convert to streaming format expected by frontend
                        def generate_stream():
                            import json
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
                print(f"Error connecting to secure backend: {e}")
                # Fall back to original implementation
                pass
        
        # Original implementation as fallback
        messages = request.messages
        openai_messages = convert_to_openai_messages(messages)

        response = StreamingResponse(stream_text(openai_messages, protocol))
        response.headers['x-vercel-ai-data-stream'] = 'v1'
        return response
        
    except Exception as e:
        print(f"Error in handle_chat_data: {e}")
        raise HTTPException(status_code=400, detail=str(e))
