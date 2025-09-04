# Production Deployment Guide

## File Storage in Production

### ⚠️ **Vercel Limitations**
- **Read-only filesystem** - Cannot write files during runtime
- **Serverless functions** - No persistent local storage
- Files must use external storage services in production

### ✅ **Recommended Production Setup**

#### **Option 1: Vercel Blob Storage (Recommended)**

1. **Enable Vercel Blob Storage**:
   ```bash
   # In your Vercel dashboard, enable Blob storage
   # Get your BLOB_READ_WRITE_TOKEN from Vercel dashboard
   ```

2. **Update Environment Variables**:
   ```bash
   # In Vercel dashboard or .env.production
   DOCUMENT_STORAGE_TYPE="vercel_blob"
   BLOB_READ_WRITE_TOKEN="your_vercel_blob_token"
   ```

3. **Run Enhanced Processor**:
   - Files will automatically upload to Vercel Blob
   - URLs will be stored in database as: `https://xyz.public.blob.vercel-storage.com/filename.pdf`
   - Admin panel "Original File" buttons will redirect to these URLs

#### **Option 2: AWS S3 Storage**

1. **Setup S3 Bucket**:
   ```bash
   # Create S3 bucket with public read access
   aws s3 mb s3://yale-ventures-documents
   ```

2. **Update Environment Variables**:
   ```bash
   DOCUMENT_STORAGE_TYPE="s3"
   AWS_ACCESS_KEY_ID="your_access_key"
   AWS_SECRET_ACCESS_KEY="your_secret_key"
   AWS_REGION="us-east-1"
   S3_DOCUMENTS_BUCKET="yale-ventures-documents"
   ```

3. **Install Dependencies** (on processing server):
   ```bash
   pip install boto3
   ```

### 🔄 **Migration from Local to Production**

#### **Development → Production**
```bash
# 1. Local development (current)
DOCUMENT_STORAGE_TYPE="local"  # Files in /public/documents/

# 2. Production deployment
DOCUMENT_STORAGE_TYPE="vercel_blob"  # Files in Vercel Blob Storage
```

#### **Re-run Processing for Production**
```bash
cd /Users/liamhr/dev/aura_rag/scripts/packaging
python enhanced_notion_processor.py

# Will upload files to cloud storage and update database
```

### 📊 **How It Works**

1. **Document Processing**:
   - Enhanced processor extracts documents from Notion
   - Original files (PDFs, DOCX) are copied to cloud storage
   - Database stores both text content AND cloud storage URLs

2. **File Serving**:
   - Admin panel "Original File" button → `/files/filename.pdf`
   - API checks database for `permanent_file_path`
   - If cloud URL (starts with `http`): Redirects to cloud storage
   - If local path: Serves file directly (dev only)

3. **Production Flow**:
   ```
   User clicks "Original File" 
   → /files/document.pdf 
   → API looks up permanent_file_path 
   → Redirects to https://blob.vercel-storage.com/document.pdf
   ```

### 🛠️ **Environment Configuration**

#### **.env.local** (Development)
```bash
DOCUMENT_STORAGE_TYPE="local"
FRONTEND_PATH="/Users/liamhr/dev/aura-yv-chatbot"
```

#### **Vercel Environment Variables** (Production)
```bash
DOCUMENT_STORAGE_TYPE="vercel_blob"
BLOB_READ_WRITE_TOKEN="vercel_blob_xxx"
```

### 🔍 **Testing Production Setup**

1. **Set environment variables**:
   ```bash
   export DOCUMENT_STORAGE_TYPE="vercel_blob"
   export BLOB_READ_WRITE_TOKEN="your_token"
   ```

2. **Run processor**:
   ```bash
   python enhanced_notion_processor.py
   ```

3. **Check output**:
   ```
   📁 Using Vercel Blob storage for documents
   ✅ Uploaded to Vercel Blob: document.pdf
   💾 Stored 25/25 documents in database
   ```

4. **Verify in admin panel**:
   - "Original File" buttons should work
   - Files should redirect to `https://xyz.blob.vercel-storage.com/...`

### 💰 **Cost Considerations**

- **Vercel Blob**: Pay per GB stored + bandwidth
- **AWS S3**: Very low cost for document storage
- **Local Development**: Free but not production-ready

### 🔒 **Security**

- Vercel Blob URLs are publicly accessible but hard to guess
- For sensitive documents, consider signed URLs or access controls
- Current implementation serves files publicly via direct URLs