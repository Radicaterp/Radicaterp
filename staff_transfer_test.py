#!/usr/bin/env python3
"""
Comprehensive Staff Transfer Endpoint Testing
Tests the POST /api/super-admin/staff/transfer endpoint functionality
"""

import requests
import json
from datetime import datetime

class StaffTransferTester:
    def __init__(self, base_url="https://fivem-management.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def test_endpoint_exists(self):
        """Test that the staff transfer endpoint exists and responds correctly"""
        print("\n=== TESTING STAFF TRANSFER ENDPOINT EXISTENCE ===")
        
        url = f"{self.api_url}/super-admin/staff/transfer"
        
        try:
            # Test with no authentication - should return 401
            response = self.session.post(url, json={})
            
            if response.status_code == 401:
                self.log_test("Endpoint exists and requires authentication", True, "Returns 401 as expected")
            elif response.status_code == 404:
                self.log_test("Endpoint exists and requires authentication", False, "Endpoint not found (404)")
            else:
                self.log_test("Endpoint exists and requires authentication", False, f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Endpoint exists and requires authentication", False, f"Error: {str(e)}")

    def test_authentication_requirement(self):
        """Test that the endpoint properly requires Super Admin authentication"""
        print("\n=== TESTING AUTHENTICATION REQUIREMENTS ===")
        
        url = f"{self.api_url}/super-admin/staff/transfer"
        
        # Test various authentication scenarios
        test_cases = [
            {
                "name": "No authentication headers",
                "headers": {},
                "expected_status": 401
            },
            {
                "name": "Invalid session token",
                "headers": {},
                "cookies": {"session_token": "invalid_token_12345"},
                "expected_status": 401
            },
            {
                "name": "Empty session token",
                "headers": {},
                "cookies": {"session_token": ""},
                "expected_status": 401
            }
        ]
        
        for case in test_cases:
            try:
                response = self.session.post(
                    url, 
                    json={"discord_id": "123456789", "new_team_id": "test-team"},
                    headers=case["headers"],
                    cookies=case.get("cookies", {})
                )
                
                success = response.status_code == case["expected_status"]
                details = f"Status: {response.status_code} (Expected: {case['expected_status']})"
                
                if not success:
                    try:
                        error_data = response.json()
                        details += f" - {error_data.get('detail', 'Unknown error')}"
                    except:
                        details += f" - {response.text[:100]}"
                
                self.log_test(case["name"], success, details)
                
            except Exception as e:
                self.log_test(case["name"], False, f"Error: {str(e)}")

    def test_request_validation(self):
        """Test request data validation"""
        print("\n=== TESTING REQUEST DATA VALIDATION ===")
        
        url = f"{self.api_url}/super-admin/staff/transfer"
        
        # Test various invalid request data scenarios
        test_cases = [
            {
                "name": "Empty request body",
                "data": {},
                "expected_status": 401  # Will fail auth first
            },
            {
                "name": "Missing discord_id",
                "data": {"new_team_id": "test-team-id"},
                "expected_status": 401  # Will fail auth first
            },
            {
                "name": "Missing new_team_id",
                "data": {"discord_id": "123456789"},
                "expected_status": 401  # Will fail auth first
            },
            {
                "name": "Invalid discord_id type (number)",
                "data": {"discord_id": 123456789, "new_team_id": "test-team-id"},
                "expected_status": 401  # Will fail auth first
            },
            {
                "name": "Invalid new_team_id type (number)",
                "data": {"discord_id": "123456789", "new_team_id": 12345},
                "expected_status": 401  # Will fail auth first
            },
            {
                "name": "Null discord_id",
                "data": {"discord_id": None, "new_team_id": "test-team-id"},
                "expected_status": 401  # Will fail auth first
            },
            {
                "name": "Null new_team_id",
                "data": {"discord_id": "123456789", "new_team_id": None},
                "expected_status": 401  # Will fail auth first
            },
            {
                "name": "Extra fields in request",
                "data": {
                    "discord_id": "123456789", 
                    "new_team_id": "test-team-id",
                    "extra_field": "should_be_ignored",
                    "another_field": 12345
                },
                "expected_status": 401  # Will fail auth first
            }
        ]
        
        for case in test_cases:
            try:
                response = self.session.post(url, json=case["data"])
                
                success = response.status_code == case["expected_status"]
                details = f"Status: {response.status_code} (Expected: {case['expected_status']})"
                
                if not success:
                    try:
                        error_data = response.json()
                        details += f" - {error_data.get('detail', 'Unknown error')}"
                    except:
                        details += f" - {response.text[:100]}"
                
                self.log_test(case["name"], success, details)
                
            except Exception as e:
                self.log_test(case["name"], False, f"Error: {str(e)}")

    def test_endpoint_method_support(self):
        """Test that endpoint only supports POST method"""
        print("\n=== TESTING HTTP METHOD SUPPORT ===")
        
        url = f"{self.api_url}/super-admin/staff/transfer"
        test_data = {"discord_id": "123456789", "new_team_id": "test-team-id"}
        
        methods = [
            ("GET", 405),      # Method not allowed
            ("PUT", 405),      # Method not allowed  
            ("DELETE", 405),   # Method not allowed
            ("PATCH", 405),    # Method not allowed
            ("POST", 401)      # Should work but fail auth
        ]
        
        for method, expected_status in methods:
            try:
                if method == "GET":
                    response = self.session.get(url)
                elif method == "PUT":
                    response = self.session.put(url, json=test_data)
                elif method == "DELETE":
                    response = self.session.delete(url)
                elif method == "PATCH":
                    response = self.session.patch(url, json=test_data)
                elif method == "POST":
                    response = self.session.post(url, json=test_data)
                
                success = response.status_code == expected_status
                details = f"Status: {response.status_code} (Expected: {expected_status})"
                
                self.log_test(f"{method} method support", success, details)
                
            except Exception as e:
                self.log_test(f"{method} method support", False, f"Error: {str(e)}")

    def test_content_type_handling(self):
        """Test content type handling"""
        print("\n=== TESTING CONTENT TYPE HANDLING ===")
        
        url = f"{self.api_url}/super-admin/staff/transfer"
        
        # Test different content types
        test_cases = [
            {
                "name": "JSON content type",
                "headers": {"Content-Type": "application/json"},
                "data": json.dumps({"discord_id": "123456789", "new_team_id": "test-team-id"}),
                "expected_status": 401
            },
            {
                "name": "Form data content type",
                "headers": {"Content-Type": "application/x-www-form-urlencoded"},
                "data": "discord_id=123456789&new_team_id=test-team-id",
                "expected_status": 422  # Unprocessable entity for wrong content type
            },
            {
                "name": "No content type header",
                "headers": {},
                "data": json.dumps({"discord_id": "123456789", "new_team_id": "test-team-id"}),
                "expected_status": 401
            }
        ]
        
        for case in test_cases:
            try:
                response = self.session.post(
                    url,
                    data=case["data"],
                    headers=case["headers"]
                )
                
                success = response.status_code == case["expected_status"]
                details = f"Status: {response.status_code} (Expected: {case['expected_status']})"
                
                self.log_test(case["name"], success, details)
                
            except Exception as e:
                self.log_test(case["name"], False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all staff transfer tests"""
        print("🚀 Starting Staff Transfer Endpoint Tests")
        print(f"📍 Base URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")
        print(f"🎯 Target Endpoint: POST /api/super-admin/staff/transfer")
        
        self.test_endpoint_exists()
        self.test_authentication_requirement()
        self.test_request_validation()
        self.test_endpoint_method_support()
        self.test_content_type_handling()
        
        # Print summary
        print(f"\n📊 STAFF TRANSFER TEST SUMMARY")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['name']}: {test['details']}")
        else:
            print(f"\n🎉 ALL TESTS PASSED!")
        
        return self.tests_passed == self.tests_run

def main():
    tester = StaffTransferTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())