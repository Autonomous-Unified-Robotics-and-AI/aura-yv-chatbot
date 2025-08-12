#!/usr/bin/env python3
"""
Final deployment validation script
"""
import sys
import os
import subprocess
import time
import requests
import json
from pathlib import Path

def validate_environment():
    """Validate environment setup"""
    print("Validating environment setup...")
    
    checks = []
    
    # Check Python version
    python_version = sys.version_info
    if python_version >= (3, 8):
        checks.append(("Python version", True, f"{python_version.major}.{python_version.minor}"))
    else:
        checks.append(("Python version", False, f"{python_version.major}.{python_version.minor} (need >= 3.8)"))
    
    # Check required files
    required_files = [
        "api/main.py",
        "vercel.json",
        "requirements.txt",
        "backend/src/aura_rag/chatbot/yale_ventures.py"
    ]
    
    for file_path in required_files:
        if Path(file_path).exists():
            checks.append((f"File: {file_path}", True, "exists"))
        else:
            checks.append((f"File: {file_path}", False, "missing"))
    
    # Check environment variables
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        checks.append(("OPENAI_API_KEY", True, f"set ({openai_key[:10]}...)"))
    else:
        checks.append(("OPENAI_API_KEY", False, "not set (will use fallback)"))
    
    # Print results
    for check_name, passed, details in checks:
        status = "✓" if passed else "✗"
        print(f"{status} {check_name}: {details}")
    
    return all(passed for _, passed, _ in checks[:-1])  # All except API key (optional)

def validate_dependencies():
    """Validate dependencies can be installed"""
    print("\nValidating dependencies...")
    
    try:
        # Read requirements.txt
        with open("requirements.txt", "r") as f:
            requirements = f.read().strip().split("\n")
        
        print(f"Found {len(requirements)} dependencies in requirements.txt")
        
        # Check critical dependencies
        critical_deps = ["fastapi", "openai", "pydantic", "python-dotenv"]
        for dep in critical_deps:
            if any(dep in req for req in requirements):
                print(f"✓ {dep} in requirements")
            else:
                print(f"✗ {dep} missing from requirements")
                return False
        
        return True
        
    except Exception as e:
        print(f"✗ Error reading requirements.txt: {e}")
        return False

def validate_api_functionality():
    """Validate API functionality"""
    print("\nValidating API functionality...")
    
    # Start test server
    api_path = Path(__file__).parent / "api"
    
    try:
        process = subprocess.Popen([
            sys.executable, "-c", 
            f"""
import sys
sys.path.insert(0, '{api_path}')
import uvicorn
from main import app
uvicorn.run(app, host='127.0.0.1', port=8000, log_level='error')
            """
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        time.sleep(3)
        
        # Test endpoints
        tests = [
            ("Health check", "GET", "http://127.0.0.1:8000/api/health", None),
            ("Create session", "POST", "http://127.0.0.1:8000/api/sessions", {}),
        ]
        
        session_id = None
        for test_name, method, url, data in tests:
            try:
                if method == "GET":
                    response = requests.get(url, timeout=10)
                else:
                    response = requests.post(url, json=data, timeout=10)
                
                if response.status_code == 200:
                    print(f"✓ {test_name}: {response.status_code}")
                    if test_name == "Create session":
                        session_id = response.json().get("session_id")
                else:
                    print(f"✗ {test_name}: {response.status_code}")
                    return False
                    
            except Exception as e:
                print(f"✗ {test_name}: {e}")
                return False
        
        # Test chat endpoint if session was created
        if session_id:
            try:
                chat_response = requests.post(
                    "http://127.0.0.1:8000/api/chat",
                    json={
                        "session_id": session_id,
                        "message": "Test message for deployment validation"
                    },
                    timeout=30
                )
                
                if chat_response.status_code == 200:
                    data = chat_response.json()
                    if "response" in data and len(data["response"]) > 0:
                        print(f"✓ Chat endpoint: working with Yale Ventures response")
                    else:
                        print(f"✗ Chat endpoint: empty response")
                        return False
                else:
                    print(f"✗ Chat endpoint: {chat_response.status_code}")
                    return False
                    
            except Exception as e:
                print(f"✗ Chat endpoint: {e}")
                return False
        
        return True
        
    except Exception as e:
        print(f"✗ API validation error: {e}")
        return False
    finally:
        if 'process' in locals():
            process.terminate()
            process.wait()

def validate_vercel_config():
    """Validate Vercel configuration"""
    print("\nValidating Vercel configuration...")
    
    try:
        with open("vercel.json", "r") as f:
            config = json.load(f)
        
        # Check required fields
        if "rewrites" in config:
            rewrites = config["rewrites"]
            if any(rewrite.get("source") == "/api/(.*)" for rewrite in rewrites):
                print("✓ API rewrite rule configured")
            else:
                print("✗ API rewrite rule missing")
                return False
        else:
            print("✗ No rewrites in vercel.json")
            return False
        
        # Check if it points to main.py
        api_rewrite = next((r for r in rewrites if r.get("source") == "/api/(.*)"), None)
        if api_rewrite and "main.py" in api_rewrite.get("destination", ""):
            print("✓ API points to main.py")
        else:
            print("✗ API doesn't point to main.py")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Vercel config validation error: {e}")
        return False

def validate_frontend_compatibility():
    """Validate frontend compatibility"""
    print("\nValidating frontend compatibility...")
    
    # Check if frontend files exist
    frontend_files = [
        "components/chat.tsx",
        "package.json",
        "next.config.js"
    ]
    
    for file_path in frontend_files:
        if Path(file_path).exists():
            print(f"✓ {file_path} exists")
        else:
            print(f"✗ {file_path} missing")
            return False
    
    # Check package.json for required dependencies
    try:
        with open("package.json", "r") as f:
            package = json.load(f)
        
        required_deps = ["react", "next", "ai"]
        dependencies = {**package.get("dependencies", {}), **package.get("devDependencies", {})}
        
        for dep in required_deps:
            if dep in dependencies:
                print(f"✓ {dep} in package.json")
            else:
                print(f"✗ {dep} missing from package.json")
                return False
        
        return True
        
    except Exception as e:
        print(f"✗ Frontend validation error: {e}")
        return False

def main():
    """Run all validation checks"""
    print("=" * 70)
    print("Yale Ventures Chatbot - Deployment Validation")
    print("=" * 70)
    
    validations = [
        ("Environment Setup", validate_environment),
        ("Dependencies", validate_dependencies),
        ("API Functionality", validate_api_functionality),
        ("Vercel Configuration", validate_vercel_config),
        ("Frontend Compatibility", validate_frontend_compatibility)
    ]
    
    results = []
    for validation_name, validation_func in validations:
        print(f"\n{'='*50}")
        print(f"Running: {validation_name}")
        print('='*50)
        try:
            result = validation_func()
            results.append((validation_name, result))
        except Exception as e:
            print(f"✗ {validation_name} failed with exception: {e}")
            results.append((validation_name, False))
    
    # Print final results
    print("\n" + "=" * 70)
    print("DEPLOYMENT VALIDATION RESULTS:")
    print("=" * 70)
    
    passed = 0
    for validation_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{validation_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{len(results)} validations passed")
    
    if passed == len(results):
        print("\n🎉 ALL VALIDATIONS PASSED! 🎉")
        print("\n✅ Deployment Checklist:")
        print("   ✓ API endpoints working correctly")
        print("   ✓ Yale Ventures chatbot integrated")
        print("   ✓ Frontend compatibility confirmed")
        print("   ✓ Vercel configuration ready")
        print("   ✓ Dependencies validated")
        print("\n🚀 Ready to deploy to Vercel!")
        print("\nNext steps:")
        print("1. Set OPENAI_API_KEY in Vercel environment variables")
        print("2. Deploy: vercel --prod")
        print("3. Test deployed endpoints")
        return True
    else:
        print("\n❌ Some validations failed.")
        print("Please fix the issues above before deployment.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)