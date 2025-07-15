# Yale Ventures Chatbot - Setup Guide

This application consists of a Next.js frontend and a secure FastAPI backend for AI-powered chat assistance.

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- OpenAI API key

## Setup Instructions

### 1. Extract the Secure Backend

If you have the secure backend tarball, extract it to the project directory:

```bash
tar -xzf yale-ventures-backend-secure.tar.gz
```

This will create a `yale-ventures-backend-secure/` directory containing the compiled backend binary.

### 2. Environment Configuration

Create a `.env` file in the top-level directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Backend Configuration (optional - defaults to localhost:8000)
BACKEND_URL=http://localhost:8000

# Environment Settings
NODE_ENV=development
LOG_LEVEL=INFO

# CORS Settings (optional)
ALLOWED_ORIGINS=*
ALLOWED_HOSTS=*
```

### 3. Install Frontend Dependencies

```bash
npm install
```

### 4. Build and Start the Application

#### Option A: Run Both Frontend and Backend (Recommended)

```bash
npm run dev
```

This command will:
- Start the secure backend on port 8000
- Start the Next.js frontend on port 3000
- Both services will run concurrently

#### Option B: Run Services Separately

**Start the secure backend:**
```bash
npm run backend-secure
```

**In a separate terminal, start the frontend:**
```bash
npm run next-dev
```

#### Option C: Use Original Python API (Development)

If you want to use the original Python API instead of the secure backend:
```bash
npm run dev-original
```

## Accessing the Application

### Frontend Application
- **URL**: http://localhost:3000
- **Description**: Main chat interface for interacting with the AI assistant

### API Documentation
- **URL**: http://localhost:8000/api/docs (Swagger UI)
- **Alternative**: http://localhost:8000/api/redoc (ReDoc)
- **Description**: Interactive API documentation for the backend services

### Health Check
- **URL**: http://localhost:8000/api/health
- **Description**: Backend health status and service information

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and secure backend |
| `npm run dev-original` | Start frontend with original Python API |
| `npm run next-dev` | Start only the Next.js frontend |
| `npm run backend-secure` | Start only the secure backend |
| `npm run fastapi-dev` | Start only the original Python API |
| `npm run build` | Build the frontend for production |
| `npm run start` | Start the production build |
| `npm run lint` | Run linting checks |

## Architecture Overview

```
Frontend (Port 3000)
    ↓
Next.js Rewrites
    ↓
Secure Backend (Port 8000)
    ↓
OpenAI API
```

### Request Flow

1. **Frontend** sends chat messages using AI SDK format
2. **Custom fetch function** converts AI SDK format to secure backend format
3. **Secure backend** processes the request and communicates with OpenAI
4. **Response** is converted back to AI SDK streaming format for the frontend

### Message Format Conversion

**Frontend sends (AI SDK format):**
```json
{
  "messages": [
    {"role": "user", "content": "Hello, I'm interested in startup funding"}
  ]
}
```

**Backend receives (Secure backend format):**
```json
{
  "message": "Hello, I'm interested in startup funding",
  "session_id": "sess_abc123"
}
```

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **Port 8000 already in use**
   ```bash
   lsof -ti:8000 | xargs kill -9
   ```

3. **Backend not starting**
   - Ensure the `yale-ventures-backend-secure` binary has execute permissions:
     ```bash
     chmod +x yale-ventures-backend-secure/yale-ventures-backend-secure
     ```

4. **OpenAI API errors**
   - Verify your `OPENAI_API_KEY` is set correctly in `.env`
   - Check your OpenAI account has available credits

5. **CORS errors**
   - Ensure `ALLOWED_ORIGINS` includes your frontend URL
   - Check that both services are running on expected ports

### Debugging

Enable debug logging by setting:
```bash
LOG_LEVEL=DEBUG
```

Check the console output for detailed request/response information.

## Development

### File Structure

```
├── components/          # React components
├── lib/                # Utility functions
├── hooks/              # Custom React hooks
├── api/                # Python API (original)
├── yale-ventures-backend-secure/  # Secure backend binary
├── .env                # Environment variables
├── next.config.js      # Next.js configuration
└── package.json        # Dependencies and scripts
```

### Making Changes

- **Frontend changes**: Edit files in `components/`, `lib/`, `hooks/`
- **Styling**: Uses Tailwind CSS
- **API integration**: Modify the custom fetch function in `components/chat.tsx`

## Production Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Set production environment variables
3. Deploy both frontend and backend services
4. Ensure proper CORS and security configurations

## Support

For issues and questions:
- Check the API documentation at http://localhost:8000/api/docs
- Review the console logs for error details
- Verify all environment variables are set correctly