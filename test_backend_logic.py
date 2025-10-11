#!/usr/bin/env python3
"""
Test the exact Firestore query logic used in the backend
"""
import os
import sys
from datetime import datetime
import logging

# Add the Backend directory to Python path
backend_dir = os.path.join(os.path.dirname(__file__), 'Backend')
sys.path.insert(0, backend_dir)

# Import Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, firestore

# Configure logging
logging.basicConfig(level=logging.INFO)

def test_backend_query_logic():
    """Test the exact query logic used in the backend"""
    user_id = "h30MlWtPyaT35EcKKpbGTtLrmg03"
    
    print("🔍 Testing Backend Query Logic...")
    
    # Initialize Firebase if not already done
    if not firebase_admin._apps:
        print("🔄 Initializing Firebase...")
        cred_path = r"c:\Users\sachi\Desktop\Amrita\Sem-5\DMBS\Project\Finze\Finze Backend\Finze_Backend\finze-d5d1c-firebase-adminsdk-fbsvc-5400815126.json"
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized")
        else:
            print(f"❌ Credentials file not found at: {cred_path}")
            return
    
    # Get Firestore client
    db = firestore.client()
    
    print(f"🔍 Testing queries for user: {user_id}")
    
    # Test 1: Simple query (no ordering) - This should work
    print("\n📋 Test 1: Simple query (no ordering)")
    try:
        simple_query = db.collection('expenses').where('user_id', '==', user_id)
        simple_docs = list(simple_query.stream())
        print(f"✅ Simple query succeeded: Found {len(simple_docs)} documents")
        
        for doc in simple_docs:
            data = doc.to_dict()
            amount = data.get('amount', 0)
            description = data.get('description', 'Unknown')
            created_at = data.get('created_at', 'Unknown')
            print(f"   - {description}: ₹{amount} (created: {created_at})")
            
    except Exception as e:
        print(f"❌ Simple query failed: {e}")
        return
    
    # Test 2: Query with ordering (should fail due to index)
    print("\n📋 Test 2: Query with ordering (expected to fail)")
    try:
        ordered_query = db.collection('expenses').where('user_id', '==', user_id).order_by('created_at', direction=firestore.Query.DESCENDING)
        ordered_docs = list(ordered_query.stream())
        print(f"✅ Ordered query succeeded: Found {len(ordered_docs)} documents")
    except Exception as e:
        print(f"❌ Ordered query failed (expected): {e}")
    
    # Test 3: Exact backend logic simulation
    print("\n📋 Test 3: Backend logic simulation")
    
    def get_user_expenses_simulation(user_id):
        """Simulate the exact backend logic"""
        try:
            # Try ordered query first
            print("   🔄 Trying ordered query...")
            query = db.collection('expenses').where('user_id', '==', user_id).order_by('created_at', direction=firestore.Query.DESCENDING)
            docs = list(query.stream())
            print(f"   ✅ Ordered query: {len(docs)} docs")
            return docs
        except Exception as e:
            print(f"   ❌ Ordered query failed: {e}")
            
            try:
                # Fallback to simple query
                print("   🔄 Trying simple query...")
                query = db.collection('expenses').where('user_id', '==', user_id)
                docs = list(query.stream())
                print(f"   ✅ Simple query: {len(docs)} docs")
                return docs
            except Exception as e2:
                print(f"   ❌ Simple query failed: {e2}")
                
                try:
                    # Final fallback - get all and filter
                    print("   🔄 Trying final fallback...")
                    all_docs = db.collection('expenses').stream()
                    user_docs = [doc for doc in all_docs if doc.to_dict().get('user_id') == user_id]
                    print(f"   ✅ Final fallback: {len(user_docs)} docs")
                    return user_docs
                except Exception as e3:
                    print(f"   ❌ Final fallback failed: {e3}")
                    return []
    
    # Run the simulation
    result_docs = get_user_expenses_simulation(user_id)
    print(f"\n🎯 Backend simulation result: {len(result_docs)} documents found")
    
    if result_docs:
        total_expenses = 0
        total_income = 0
        
        for doc in result_docs:
            data = doc.to_dict()
            amount = data.get('amount', 0)
            description = data.get('description', 'Unknown')
            
            if amount < 0:
                total_expenses += abs(amount)
            else:
                total_income += amount
                
            print(f"   - {description}: ₹{amount}")
        
        print(f"\n💰 Summary:")
        print(f"   Total Expenses: ₹{total_expenses}")
        print(f"   Total Income: ₹{total_income}")
        print(f"   Savings Rate: {((total_income - total_expenses) / total_income * 100):.1f}%")
    else:
        print("❌ No documents found - this explains why backend returns empty results!")

if __name__ == "__main__":
    test_backend_query_logic()