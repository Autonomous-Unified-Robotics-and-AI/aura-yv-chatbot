import os
import json
import logging
import uuid
from datetime import datetime
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse
from dotenv import load_dotenv
from contextlib import asynccontextmanager
import asyncio
from typing import Optional

# Internal imports (from backend repository)
import sys
from pathlib import Path

# Add backend to path
backend_api_path = Path(__file__).parent.parent / "backend" / "api"
backend_root_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_api_path))
sys.path.insert(0, str(backend_root_path))

# Import backend modules
try:
    from models import (
        ChatRequest, ChatResponse, SessionCreate, SessionResponse,
        SessionStatus, FeedbackRequest, HealthResponse
    )
    from services.session_manager import SessionManager
    from services.chatbot_service import ChatbotService
except ImportError as e:
    logging.error(f"Failed to import backend modules: {e}")
    # Fallback to creating minimal implementations
    from typing import Dict, Any
    
    class MockSessionManager:
        def __init__(self):
            self.sessions = {}
        
        async def initialize(self):
            pass
            
        async def create_session(self, session_data):
            session_id = f"sess_{uuid.uuid4().hex[:12]}"
            session = type('Session', (), {
                'session_id': session_id,
                'created_at': datetime.now().isoformat()
            })()
            self.sessions[session_id] = session
            return session
            
        async def get_session(self, session_id):
            return self.sessions.get(session_id)
            
        async def update_session(self, session_id, data):
            pass
            
        def is_healthy(self):
            return True
    
    class MockChatbotService:
        def __init__(self):
            pass
            
        async def initialize(self):
            pass
            
        async def process_message(self, session_id, message, session_data):
            return {
                "response": "I'm experiencing some technical difficulties. Please try again.",
                "phase": "welcome_data_collection",
                "completion_rate": 0.1,
                "should_collect": ["user_name", "user_role"],
                "next_actions": [],
                "rag_triggered": False,
                "citations": []
            }
            
        def is_healthy(self):
            return True
    
    # Use mock implementations
    SessionManager = MockSessionManager
    ChatbotService = MockChatbotService
    
    # Create mock model classes
    class SessionCreate:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)
    
    class SessionResponse:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)
        
        def model_dump_json(self):
            return json.dumps(self.__dict__)
    
    class ChatRequest:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)
    
    class ChatResponse:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)
        
        def model_dump_json(self):
            return json.dumps(self.__dict__)
    
    class SessionStatus:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)
        
        def model_dump_json(self):
            return json.dumps(self.__dict__)
    
    class FeedbackRequest:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)
    
    class HealthResponse:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)
        
        def model_dump_json(self):
            return json.dumps(self.__dict__)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize global services
session_manager: Optional[SessionManager] = None
chatbot_service: Optional[ChatbotService] = None

async def init_services():
    global session_manager, chatbot_service
    session_manager = SessionManager()
    chatbot_service = ChatbotService()
    await session_manager.initialize()
    await chatbot_service.initialize()

# Sync wrapper for initialization (used in handler constructor)
def run_async_init():
    asyncio.run(init_services())

from vercel_python_wsgi import WSGIRequestHandler

# Initialize services once
services_initialized = False

def init_services_once():
    global services_initialized
    if not services_initialized:
        run_async_init()
        services_initialized = True

def handler(request, context):
    init_services_once()
    
    method = request.method
    path = request.path
    
    # Handle CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            },
            'body': ''
        }
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    try:
        if method == 'GET':
            if path == '/api/health':
                response = HealthResponse(
                    status="healthy",
                    version="1.0.0",
                    services={
                        "session_manager": session_manager.is_healthy() if session_manager else False,
                        "chatbot_service": chatbot_service.is_healthy() if chatbot_service else False
                    }
                )
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': response.model_dump_json()
                }
            
            elif path.startswith('/api/sessions/'):
                path_parts = path.strip('/').split('/')
                if len(path_parts) == 3:  # /api/sessions/{session_id}
                    session_id = path_parts[2]
                    session = asyncio.run(session_manager.get_session(session_id))
                    if not session:
                        return {
                            'statusCode': 404,
                            'headers': headers,
                            'body': json.dumps({"error": "Session not found"})
                        }
                    
                    response = SessionStatus(
                        session_id=session.session_id,
                        phase=session.current_phase,
                        completion_rate=session.completion_rate,
                        database_fields=session.database_fields,
                        missing_required=session.missing_required,
                        created_at=session.created_at,
                        last_activity=session.last_activity,
                        message_count=len(session.conversation_history)
                    )
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': response.model_dump_json()
                    }
                
                elif len(path_parts) == 4 and path_parts[3] == 'export':  # /api/sessions/{session_id}/export
                    session_id = path_parts[2]
                    session = asyncio.run(session_manager.get_session(session_id))
                    if not session:
                        return {
                            'statusCode': 404,
                            'headers': headers,
                            'body': json.dumps({"error": "Session not found"})
                        }
                    
                    export_data = asyncio.run(session_manager.export_session_data(session_id))
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps(export_data)
                    }
            
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({"error": "Not Found"})
            }
        
        elif method == 'POST':
            try:
                data = json.loads(request.body) if hasattr(request, 'body') and request.body else {}
            except json.JSONDecodeError:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({"error": "Invalid JSON"})
                }
            
            if path == '/api/sessions':
                session_create = SessionCreate(**data)
                session = asyncio.run(session_manager.create_session(session_create))
                response = SessionResponse(
                    session_id=session.session_id,
                    status="created",
                    created_at=session.created_at,
                    phase="welcome_data_collection",
                    completion_rate=0.0
                )
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': response.model_dump_json()
                }
            
            elif path == '/api/chat':
                chat_req = ChatRequest(**data)
                session = asyncio.run(session_manager.get_session(chat_req.session_id))
                if not session:
                    return {
                        'statusCode': 404,
                        'headers': headers,
                        'body': json.dumps({"error": "Session not found"})
                    }
                
                response_data = asyncio.run(chatbot_service.process_message(
                    session_id=chat_req.session_id,
                    message=chat_req.message,
                    session_data=session
                ))
                asyncio.run(session_manager.update_session(chat_req.session_id, response_data))
                response = ChatResponse(
                    session_id=chat_req.session_id,
                    response=response_data["response"],
                    phase=response_data["phase"],
                    completion_rate=response_data["completion_rate"],
                    should_collect=response_data.get("should_collect", []),
                    next_actions=response_data.get("next_actions", []),
                    rag_triggered=response_data.get("rag_triggered", False),
                    citations=response_data.get("citations", [])
                )
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': response.model_dump_json()
                }
            
            elif path == '/api/feedback':
                feedback = FeedbackRequest(**data)
                asyncio.run(session_manager.store_feedback(feedback.session_id, feedback))
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({"status": "success", "message": "Feedback submitted successfully"})
                }
            
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({"error": "Not Found"})
            }
        
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({"error": "Method Not Allowed"})
        }
    
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({"error": "Internal Server Error"})
        }
