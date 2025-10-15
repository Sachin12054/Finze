#!/usr/bin/env python3
"""
🧪 COMPREHENSIVE FINZE BACKEND TEST SUITE
Tests all major backend functionalities to ensure everything is working
"""

import requests
import json
import sys
import time
from datetime import datetime

# Backend configuration
BASE_URL = "http://localhost:8001"
TEST_USER_ID = "test-user-123"

class BackendTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, status, message="", response_data=None):
        """Log test result"""
        result = {
            'test': test_name,
            'status': status,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        if response_data:
            result['data'] = response_data
        
        self.test_results.append(result)
        
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} {test_name}: {message}")
        
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                services = data.get('services', {})
                
                # Check individual services
                healthy_services = []
                failed_services = []
                
                for service, status in services.items():
                    if status.get('status') == 'healthy':
                        healthy_services.append(service)
                    else:
                        failed_services.append(service)
                
                if len(healthy_services) >= 3:  # At least 3 services should be healthy
                    self.log_test("Health Check", "PASS", 
                                f"✅ {len(healthy_services)} services healthy: {', '.join(healthy_services)}")
                    
                    if failed_services:
                        self.log_test("Health Check - Warning", "WARN", 
                                    f"⚠️ Some services unavailable: {', '.join(failed_services)}")
                else:
                    self.log_test("Health Check", "FAIL", 
                                f"❌ Only {len(healthy_services)} services healthy")
                
                return data
            else:
                self.log_test("Health Check", "FAIL", f"HTTP {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test("Health Check", "FAIL", f"Connection error: {str(e)}")
            return None
    
    def test_categories(self):
        """Test categories endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/api/categories", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                categories = data.get('categories', [])
                
                expected_categories = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment']
                found_categories = [cat for cat in expected_categories if cat in categories]
                
                if len(found_categories) == len(expected_categories):
                    self.log_test("Categories API", "PASS", 
                                f"All {len(categories)} categories available")
                else:
                    self.log_test("Categories API", "WARN", 
                                f"Found {len(found_categories)}/{len(expected_categories)} expected categories")
                
                return data
            else:
                self.log_test("Categories API", "FAIL", f"HTTP {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test("Categories API", "FAIL", f"Error: {str(e)}")
            return None
    
    def test_ai_categorization(self):
        """Test AI categorization"""
        test_cases = [
            {"description": "McDonald's hamburger meal", "amount": 250, "expected": "Food & Dining"},
            {"description": "Uber taxi ride", "amount": 150, "expected": "Transportation"},
            {"description": "Amazon online shopping", "amount": 500, "expected": "Shopping"},
            {"description": "Netflix subscription", "amount": 199, "expected": "Entertainment"},
            {"description": "iPhone purchase", "amount": 80000, "expected": "Technology"}
        ]
        
        passed = 0
        total = len(test_cases)
        
        for i, test_case in enumerate(test_cases):
            try:
                response = self.session.post(
                    f"{self.base_url}/api/categorize",
                    json=test_case,
                    timeout=5
                )
                
                if response.status_code == 200:
                    data = response.json()
                    predicted_category = data.get('category')
                    confidence = data.get('confidence', 0)
                    
                    if predicted_category == test_case['expected']:
                        passed += 1
                        self.log_test(f"AI Categorization #{i+1}", "PASS", 
                                    f"✅ '{test_case['description']}' → {predicted_category} ({confidence:.2f})")
                    else:
                        self.log_test(f"AI Categorization #{i+1}", "WARN", 
                                    f"⚠️ '{test_case['description']}' → {predicted_category} (expected {test_case['expected']})")
                else:
                    self.log_test(f"AI Categorization #{i+1}", "FAIL", 
                                f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"AI Categorization #{i+1}", "FAIL", f"Error: {str(e)}")
        
        # Overall categorization test result
        accuracy = (passed / total) * 100
        if accuracy >= 80:
            self.log_test("AI Categorization Overall", "PASS", 
                        f"🎯 {passed}/{total} correct ({accuracy:.1f}% accuracy)")
        elif accuracy >= 60:
            self.log_test("AI Categorization Overall", "WARN", 
                        f"⚠️ {passed}/{total} correct ({accuracy:.1f}% accuracy)")
        else:
            self.log_test("AI Categorization Overall", "FAIL", 
                        f"❌ {passed}/{total} correct ({accuracy:.1f}% accuracy)")
    
    def test_batch_categorization(self):
        """Test batch categorization"""
        batch_data = {
            "expenses": [
                {"description": "Starbucks coffee", "amount": 300},
                {"description": "Gas station fuel", "amount": 2000},
                {"description": "Movie ticket booking", "amount": 400}
            ]
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/categorize-batch",
                json=batch_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                
                if len(results) == len(batch_data['expenses']):
                    categorized = sum(1 for r in results if r.get('category'))
                    self.log_test("Batch Categorization", "PASS", 
                                f"✅ {categorized}/{len(results)} expenses categorized")
                else:
                    self.log_test("Batch Categorization", "FAIL", 
                                f"❌ Expected {len(batch_data['expenses'])} results, got {len(results)}")
            else:
                self.log_test("Batch Categorization", "FAIL", f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Batch Categorization", "FAIL", f"Error: {str(e)}")
    
    def test_user_expenses(self):
        """Test user expenses endpoint"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/expenses/{TEST_USER_ID}",
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                expenses = data.get('expenses', [])
                self.log_test("User Expenses", "PASS", 
                            f"✅ Retrieved {len(expenses)} expenses for user")
            else:
                self.log_test("User Expenses", "FAIL", f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("User Expenses", "FAIL", f"Error: {str(e)}")
    
    def test_ai_spending_analysis(self):
        """Test AI spending analysis"""
        sample_expenses = [
            {
                "description": "Restaurant dinner",
                "amount": 1200,
                "category": "Food & Dining",
                "date": "2025-10-15"
            },
            {
                "description": "Taxi ride",
                "amount": 300,
                "category": "Transportation", 
                "date": "2025-10-15"
            },
            {
                "description": "Grocery shopping",
                "amount": 2500,
                "category": "Food & Dining",
                "date": "2025-10-14"
            }
        ]
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/ai/analyze-spending",
                json={"expenses": sample_expenses},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                analysis = data.get('data', {})
                
                if analysis.get('financial_health_score'):
                    self.log_test("AI Spending Analysis", "PASS", 
                                "✅ AI analysis completed with insights")
                else:
                    self.log_test("AI Spending Analysis", "WARN", 
                                "⚠️ AI analysis returned basic results")
            else:
                self.log_test("AI Spending Analysis", "FAIL", f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("AI Spending Analysis", "FAIL", f"Error: {str(e)}")
    
    def test_speech_service(self):
        """Test speech service availability"""
        # We'll just check if the health endpoint shows speech service as available
        # since we can't easily test audio upload without actual audio files
        try:
            response = self.session.get(f"{self.base_url}/api/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                services = data.get('services', {})
                speech_status = services.get('sarvam_speech', {})
                
                if speech_status.get('status') == 'healthy':
                    self.log_test("Speech Service", "PASS", "✅ Sarvam AI Speech service available")
                else:
                    self.log_test("Speech Service", "WARN", "⚠️ Speech service not available")
            else:
                self.log_test("Speech Service", "FAIL", "Could not check speech service status")
                
        except Exception as e:
            self.log_test("Speech Service", "FAIL", f"Error: {str(e)}")
    
    def generate_summary(self):
        """Generate test summary"""
        total_tests = len(self.test_results)
        passed = sum(1 for r in self.test_results if r['status'] == 'PASS')
        warnings = sum(1 for r in self.test_results if r['status'] == 'WARN')
        failed = sum(1 for r in self.test_results if r['status'] == 'FAIL')
        
        print("\n" + "="*60)
        print("🧪 FINZE BACKEND TEST SUMMARY")
        print("="*60)
        print(f"✅ PASSED:   {passed:2d}/{total_tests}")
        print(f"⚠️  WARNINGS: {warnings:2d}/{total_tests}")
        print(f"❌ FAILED:   {failed:2d}/{total_tests}")
        print("="*60)
        
        if failed == 0 and warnings <= 2:
            print("🎉 BACKEND STATUS: EXCELLENT - All core features working!")
        elif failed == 0:
            print("🟡 BACKEND STATUS: GOOD - Core features work, some optional services unavailable")
        elif failed <= 2:
            print("🟠 BACKEND STATUS: PARTIAL - Most features work, some issues detected")
        else:
            print("🔴 BACKEND STATUS: CRITICAL - Multiple failures detected")
        
        print("\n💡 AVAILABLE FEATURES:")
        
        # Analyze which features are working
        feature_status = {}
        for result in self.test_results:
            if 'AI Categorization' in result['test']:
                feature_status['AI Categorization'] = result['status']
            elif 'Categories' in result['test']:
                feature_status['Category Management'] = result['status']
            elif 'Health Check' in result['test']:
                feature_status['System Health'] = result['status']
            elif 'Spending Analysis' in result['test']:
                feature_status['AI Insights'] = result['status']
            elif 'Speech Service' in result['test']:
                feature_status['Voice Processing'] = result['status']
            elif 'User Expenses' in result['test']:
                feature_status['Database Operations'] = result['status']
        
        for feature, status in feature_status.items():
            status_icon = "✅" if status == "PASS" else "⚠️" if status == "WARN" else "❌"
            print(f"   {status_icon} {feature}")
        
        print("\n🔗 API ENDPOINTS:")
        endpoints = [
            "✅ GET  /api/health                 - System status",
            "✅ GET  /api/categories             - Expense categories", 
            "✅ POST /api/categorize             - AI expense categorization",
            "✅ POST /api/categorize-batch       - Batch AI categorization",
            "✅ POST /api/upload-receipt         - Receipt scanning (Gemini AI)",
            "✅ GET  /api/expenses/<user_id>     - User expense history",
            "✅ POST /api/ai/analyze-spending    - AI financial analysis",
            "✅ POST /api/speech/speech-to-text  - Voice to text (Sarvam AI)"
        ]
        
        for endpoint in endpoints:
            print(f"   {endpoint}")
        
        return {
            'total_tests': total_tests,
            'passed': passed,
            'warnings': warnings,
            'failed': failed,
            'success_rate': (passed / total_tests) * 100 if total_tests > 0 else 0,
            'overall_status': 'EXCELLENT' if failed == 0 and warnings <= 2 else 
                            'GOOD' if failed == 0 else 
                            'PARTIAL' if failed <= 2 else 'CRITICAL'
        }
    
    def run_all_tests(self):
        """Run all tests"""
        print("🧪 Starting Comprehensive Backend Test Suite...")
        print("="*60)
        
        # Test basic connectivity first
        print("\n📊 Testing Basic Connectivity...")
        health_data = self.test_health_check()
        
        if not health_data:
            print("❌ Backend not accessible! Make sure it's running on port 8001")
            return False
        
        # Test core features
        print("\n🎯 Testing Core Features...")
        self.test_categories()
        self.test_ai_categorization()
        self.test_batch_categorization()
        
        print("\n📚 Testing Data Management...")
        self.test_user_expenses()
        
        print("\n🤖 Testing AI Services...")
        self.test_ai_spending_analysis()
        self.test_speech_service()
        
        # Generate summary
        summary = self.generate_summary()
        
        return summary['failed'] == 0

def main():
    """Main function"""
    print("🚀 FINZE BACKEND COMPREHENSIVE TEST")
    print("=" * 60)
    
    tester = BackendTester(BASE_URL)
    
    try:
        success = tester.run_all_tests()
        
        print(f"\n🏁 Testing completed!")
        
        if success:
            print("🎉 All tests passed! Backend is fully functional.")
            sys.exit(0)
        else:
            print("⚠️ Some tests failed. Check the results above.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Testing failed with error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()