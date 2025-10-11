#!/usr/bin/env python3
"""
Test script to verify Firestore connection and add sample data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Add the backend directory to path
backend_dir = r"c:\Users\sachi\Desktop\Amrita\Sem-5\DMBS\Project\Finze\Finze Backend\Finze_Backend"
sys.path.insert(0, backend_dir)

from datetime import datetime
import logging

# Set up environment
from dotenv import load_dotenv
load_dotenv()

# Set up Firebase credentials
service_account_path = r"c:\Users\sachi\Desktop\Amrita\Sem-5\DMBS\Project\Finze\Finze Backend\Finze_Backend\finze-d5d1c-firebase-adminsdk-fbsvc-5400815126.json"
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_path

# Google Cloud imports
from google.cloud import firestore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_firestore_connection():
    """Test Firestore connection and add sample data"""
    try:
        # Initialize Firestore
        db = firestore.Client()
        logger.info("✅ Firestore client initialized")
        
        # Test user ID from logs
        user_id = "h30MlWtPyaT35EcKKpbGTtLrmg03"
        
        # Check existing expenses
        expenses_ref = db.collection('expenses')
        query = expenses_ref.where('user_id', '==', user_id)
        
        existing_docs = list(query.get())
        logger.info(f"📊 Found {len(existing_docs)} existing expenses for user {user_id}")
        
        for doc in existing_docs:
            data = doc.to_dict()
            logger.info(f"   - {data.get('title', 'Unknown')}: ₹{data.get('amount', 0)}")
        
        # If no expenses exist, add the sample data
        if len(existing_docs) == 0:
            logger.info("💡 No expenses found. Adding sample data...")
            
            # Sample expenses based on your real data
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
                doc_ref = expenses_ref.add(expense)
                logger.info(f"✅ Added: {expense['title']} (₹{expense['amount']})")
            
            logger.info("🎉 Sample data added successfully!")
        
        # Test query again
        final_query = expenses_ref.where('user_id', '==', user_id)
        final_docs = list(final_query.get())
        logger.info(f"🔍 Final check: Found {len(final_docs)} expenses for user {user_id}")
        
        # Calculate totals
        total_expenses = sum(abs(doc.to_dict().get('amount', 0)) for doc in final_docs if doc.to_dict().get('amount', 0) < 0)
        total_income = sum(abs(doc.to_dict().get('amount', 0)) for doc in final_docs if doc.to_dict().get('amount', 0) > 0)
        
        logger.info(f"💰 Total Expenses: ₹{total_expenses}")
        logger.info(f"💵 Total Income: ₹{total_income}")
        logger.info(f"📈 Savings Rate: {((total_income - total_expenses) / total_income * 100):.1f}%")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Firestore test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔍 Testing Firestore connection and data...")
    success = test_firestore_connection()
    if success:
        print("✅ Firestore test completed successfully!")
    else:
        print("❌ Firestore test failed!")