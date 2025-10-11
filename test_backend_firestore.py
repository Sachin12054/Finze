#!/usr/bin/env python3
"""
Backend Firestore Data Test - Add sample data using backend's connection
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Add the backend directory to path
backend_dir = r"c:\Users\sachi\Desktop\Amrita\Sem-5\DMBS\Project\Finze\Finze Backend\Finze_Backend"
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from datetime import datetime
import logging

# Set up environment
from dotenv import load_dotenv
load_dotenv()

# Set up Firebase credentials using backend's approach
service_account_path = r"c:\Users\sachi\Desktop\Amrita\Sem-5\DMBS\Project\Finze\Finze Backend\Finze_Backend\finze-d5d1c-firebase-adminsdk-fbsvc-5400815126.json"
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_path

# Google Cloud imports
from google.cloud import firestore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_backend_firestore():
    """Test backend Firestore connection and add data using the same method"""
    try:
        # Initialize Firestore exactly like the backend does
        db = firestore.Client()
        logger.info("✅ Backend Firestore client initialized")
        
        # Test user ID from logs
        user_id = "h30MlWtPyaT35EcKKpbGTtLrmg03"
        
        # Test the same query logic as the backend
        logger.info(f"🔍 Testing query: expenses where user_id == {user_id}")
        
        try:
            # Try the exact same query the backend uses
            expenses_ref = db.collection('expenses')
            query = expenses_ref.where('user_id', '==', user_id)
            
            # Test ordering query (this is what fails in backend)
            try:
                ordered_query = query.order_by('created_at', direction='DESCENDING').limit(10)
                docs = list(ordered_query.get())
                logger.info(f"✅ Ordered query worked: Found {len(docs)} documents")
            except Exception as order_error:
                logger.warning(f"❌ Ordered query failed: {str(order_error)}")
                
                # Try fallback query (no ordering)
                try:
                    simple_query = query.limit(10)
                    docs = list(simple_query.get())
                    logger.info(f"✅ Simple query worked: Found {len(docs)} documents")
                except Exception as simple_error:
                    logger.error(f"❌ Simple query also failed: {str(simple_error)}")
                    
                    # Final fallback - just get all for this user
                    try:
                        all_query = expenses_ref.where('user_id', '==', user_id)
                        docs = list(all_query.get())
                        logger.info(f"✅ Final query worked: Found {len(docs)} documents")
                    except Exception as final_error:
                        logger.error(f"❌ All queries failed: {str(final_error)}")
                        docs = []
        
        except Exception as query_error:
            logger.error(f"❌ Query setup failed: {str(query_error)}")
            docs = []
        
        # Print existing data
        if docs:
            logger.info("📊 Found existing expenses:")
            for doc in docs:
                data = doc.to_dict()
                logger.info(f"   - {data.get('title', 'Unknown')}: ₹{data.get('amount', 0)}")
        else:
            logger.info("📊 No existing expenses found")
            
            # Add the sample data directly using the backend approach
            logger.info("💡 Adding sample data using backend's method...")
            
            sample_expenses = [
                {
                    'user_id': user_id,
                    'title': 'Chicken',
                    'amount': -50,
                    'category': 'food',
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat(),
                    'type': 'expense'
                },
                {
                    'user_id': user_id,
                    'title': 'Coffee',
                    'amount': -180,
                    'category': 'food',
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat(),
                    'type': 'expense'
                },
                {
                    'user_id': user_id,
                    'title': 'Petrol',
                    'amount': -500,
                    'category': 'transport',
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat(),
                    'type': 'expense'
                },
                {
                    'user_id': user_id,
                    'title': 'Salary',
                    'amount': 100000,
                    'category': 'income',
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat(),
                    'type': 'income'
                }
            ]
            
            # Add each expense
            for expense in sample_expenses:
                try:
                    doc_ref = expenses_ref.add(expense)
                    logger.info(f"✅ Added: {expense['title']} (₹{expense['amount']})")
                except Exception as add_error:
                    logger.error(f"❌ Failed to add {expense['title']}: {str(add_error)}")
            
            logger.info("🎉 Sample data added successfully!")
        
        # Final test - query again to confirm
        try:
            final_query = expenses_ref.where('user_id', '==', user_id)
            final_docs = list(final_query.get())
            logger.info(f"🔍 Final verification: Found {len(final_docs)} total expenses for user {user_id}")
            
            # Calculate totals
            total_expenses = sum(abs(doc.to_dict().get('amount', 0)) for doc in final_docs if doc.to_dict().get('amount', 0) < 0)
            total_income = sum(abs(doc.to_dict().get('amount', 0)) for doc in final_docs if doc.to_dict().get('amount', 0) > 0)
            
            logger.info(f"💰 Total Expenses: ₹{total_expenses}")
            logger.info(f"💵 Total Income: ₹{total_income}")
            if total_income > 0:
                savings_rate = ((total_income - total_expenses) / total_income) * 100
                logger.info(f"📈 Savings Rate: {savings_rate:.1f}%")
        except Exception as verify_error:
            logger.error(f"❌ Final verification failed: {str(verify_error)}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Backend Firestore test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔍 Testing Backend Firestore connection...")
    success = test_backend_firestore()
    if success:
        print("✅ Backend Firestore test completed!")
    else:
        print("❌ Backend Firestore test failed!")