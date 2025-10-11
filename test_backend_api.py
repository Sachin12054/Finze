#!/usr/bin/env python3
"""
Direct test of the backend API to see what's happening
"""
import requests
import json

def test_backend_api():
    """Test the backend API directly"""
    base_url = "http://10.220.12.202:8001"
    user_id = "h30MlWtPyaT35EcKKpbGTtLrmg03"
    
    print("🔍 Testing Backend API...")
    
    # Test health
    try:
        response = requests.get(f"{base_url}/api/health")
        print(f"✅ Health Check: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return
    
    # Test expenses endpoint
    try:
        response = requests.get(f"{base_url}/api/expenses/{user_id}")
        print(f"📊 Expenses Endpoint: {response.status_code}")
        data = response.json()
        print(f"   Count: {data.get('count', 0)}")
        print(f"   User ID: {data.get('user_id', 'None')}")
        print(f"   Expenses Length: {len(data.get('expenses', []))}")
        print(f"   Full Response: {json.dumps(data, indent=2)}")
    except Exception as e:
        print(f"❌ Expenses Endpoint Failed: {e}")
    
    # Test AI insights
    try:
        response = requests.get(f"{base_url}/api/ai-insights/{user_id}")
        print(f"🧠 AI Insights Endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Success: {data.get('success', False)}")
            print(f"   Message: {data.get('message', 'None')}")
        else:
            print(f"   Error Response: {response.text}")
    except Exception as e:
        print(f"❌ AI Insights Failed: {e}")

if __name__ == "__main__":
    test_backend_api()