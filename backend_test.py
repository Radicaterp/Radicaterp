import requests
import sys
import json
from datetime import datetime

class ReddicateAPITester:
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
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, cookies=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers, cookies=cookies)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers, cookies=cookies)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers, cookies=cookies)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers, cookies=cookies)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_basic_endpoints(self):
        """Test basic endpoints that don't require authentication"""
        print("\n=== TESTING BASIC ENDPOINTS ===")
        
        # Test Discord login URL generation
        success, response = self.run_test(
            "Discord Login URL Generation",
            "GET",
            "auth/login",
            200
        )
        
        if success and 'url' in response:
            print(f"   Discord OAuth URL: {response['url'][:50]}...")
        
        # Test teams endpoint (public)
        success, response = self.run_test(
            "Get Teams (Public)",
            "GET", 
            "teams",
            200
        )
        
        if success:
            print(f"   Found {len(response)} teams")

    def test_auth_required_endpoints(self):
        """Test endpoints that require authentication"""
        print("\n=== TESTING AUTH-REQUIRED ENDPOINTS ===")
        
        # Test auth/me without session
        self.run_test(
            "Get Current User (No Auth)",
            "GET",
            "auth/me", 
            401
        )
        
        # Test applications without auth
        self.run_test(
            "Get Applications (No Auth)",
            "GET",
            "applications",
            401
        )
        
        # Test stats without auth
        self.run_test(
            "Get Stats (No Auth)",
            "GET",
            "stats",
            401
        )

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        print("\n=== TESTING ADMIN ENDPOINTS ===")
        
        # Test create team without auth
        self.run_test(
            "Create Team (No Auth)",
            "POST",
            "teams",
            401,
            data={"name": "Test Team", "description": "Test", "type": "whitelist"}
        )
        
        # Test get users without auth
        self.run_test(
            "Get Users (No Auth)",
            "GET",
            "users",
            401
        )

    def test_owner_endpoints(self):
        """Test owner-only endpoints"""
        print("\n=== TESTING OWNER ENDPOINTS ===")
        
        # Test update user role without auth
        self.run_test(
            "Update User Role (No Auth)",
            "PUT",
            "users/123456789/role",
            401,
            data={"role": "staff"}
        )

    def test_application_endpoints(self):
        """Test application-related endpoints"""
        print("\n=== TESTING APPLICATION ENDPOINTS ===")
        
        # Test create application without auth
        self.run_test(
            "Create Application (No Auth)",
            "POST",
            "applications",
            401,
            data={"team_id": "test-id", "answers": {"name": "Test"}}
        )

    def test_team_management_endpoints(self):
        """Test team management endpoints"""
        print("\n=== TESTING TEAM MANAGEMENT ENDPOINTS ===")
        
        # Test get specific team (should work without auth)
        self.run_test(
            "Get Specific Team (Invalid ID)",
            "GET",
            "teams/invalid-id",
            404
        )
        
        # Test update team without auth
        self.run_test(
            "Update Team (No Auth)",
            "PUT",
            "teams/test-id",
            401,
            data={"name": "Updated Team", "description": "Updated", "type": "staff"}
        )
        
        # Test delete team without auth
        self.run_test(
            "Delete Team (No Auth)",
            "DELETE",
            "teams/test-id",
            401
        )

    def test_cors_and_headers(self):
        """Test CORS and header handling"""
        print("\n=== TESTING CORS AND HEADERS ===")
        
        try:
            # Test OPTIONS request
            response = requests.options(f"{self.api_url}/teams")
            success = response.status_code in [200, 204]
            self.log_test("CORS Preflight (OPTIONS)", success, f"Status: {response.status_code}")
            
            # Check CORS headers
            if 'Access-Control-Allow-Origin' in response.headers:
                print(f"   CORS Origin: {response.headers['Access-Control-Allow-Origin']}")
            
        except Exception as e:
            self.log_test("CORS Preflight (OPTIONS)", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Redicate RP Backend API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")
        
        self.test_basic_endpoints()
        self.test_auth_required_endpoints() 
        self.test_admin_endpoints()
        self.test_owner_endpoints()
        self.test_application_endpoints()
        self.test_team_management_endpoints()
        self.test_cors_and_headers()
        
        # Print summary
        print(f"\n📊 TEST SUMMARY")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ReddicateAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())