import requests
import sys
import json
from datetime import datetime

class ECommerceAPITester:
    def __init__(self, base_url="https://smartshop-57.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.merchant_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_product_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        if not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers={'Authorization': headers.get('Authorization', '')})
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@shop.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_merchant_login(self):
        """Test merchant login"""
        success, response = self.run_test(
            "Merchant Login",
            "POST",
            "auth/login",
            200,
            data={"email": "commercante@shop.com", "password": "merchant123"}
        )
        if success and 'token' in response:
            self.merchant_token = response['token']
            print(f"   Merchant token obtained: {self.merchant_token[:20]}...")
            return True
        return False

    def test_get_products_empty(self):
        """Test getting products when none exist"""
        success, response = self.run_test(
            "Get Products (Empty)",
            "GET",
            "products",
            200
        )
        return success

    def test_create_product(self):
        """Test creating a product as admin"""
        # Create a simple test image file
        import io
        from PIL import Image
        
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        files = {'image': ('test_product.jpg', img_bytes, 'image/jpeg')}
        data = {
            'name': 'Produit Test',
            'description': 'Description du produit test',
            'price': '29.99',
            'stock': '10'
        }
        
        success, response = self.run_test(
            "Create Product",
            "POST",
            "products",
            200,
            data=data,
            token=self.admin_token,
            files=files
        )
        
        if success and 'id' in response:
            self.created_product_id = response['id']
            print(f"   Product created with ID: {self.created_product_id}")
            return True
        return False

    def test_get_products_with_data(self):
        """Test getting products when they exist"""
        success, response = self.run_test(
            "Get Products (With Data)",
            "GET",
            "products",
            200
        )
        return success and len(response) > 0

    def test_get_single_product(self):
        """Test getting a single product"""
        if not self.created_product_id:
            print("❌ Skipping - No product ID available")
            return False
            
        success, response = self.run_test(
            "Get Single Product",
            "GET",
            f"products/{self.created_product_id}",
            200
        )
        return success

    def test_create_order(self):
        """Test creating an order"""
        if not self.created_product_id:
            print("❌ Skipping - No product ID available")
            return False
            
        order_data = {
            "customer": {
                "name": "Client Test",
                "email": "client@test.com",
                "phone": "0123456789",
                "address": "123 Rue Test, Paris"
            },
            "items": [
                {
                    "product_id": self.created_product_id,
                    "product_name": "Produit Test",
                    "price": 29.99,
                    "quantity": 2
                }
            ],
            "total": 59.98
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if success and 'id' in response:
            self.created_order_id = response['id']
            return True
        return False

    def test_get_orders_as_merchant(self):
        """Test getting orders as merchant"""
        success, response = self.run_test(
            "Get Orders (Merchant)",
            "GET",
            "orders",
            200,
            token=self.merchant_token
        )
        return success

    def test_update_order_status(self):
        """Test updating order status"""
        if not hasattr(self, 'created_order_id'):
            print("❌ Skipping - No order ID available")
            return False
            
        success, response = self.run_test(
            "Update Order Status",
            "PATCH",
            f"orders/{self.created_order_id}/status",
            200,
            data={"status": "accepted"},
            token=self.merchant_token
        )
        return success

    def test_update_product_stock(self):
        """Test updating product stock"""
        if not self.created_product_id:
            print("❌ Skipping - No product ID available")
            return False
            
        success, response = self.run_test(
            "Update Product Stock",
            "PATCH",
            f"products/{self.created_product_id}",
            200,
            data={"stock": 15, "available": True},
            token=self.merchant_token
        )
        return success

    def test_delete_product(self):
        """Test deleting a product as admin"""
        if not self.created_product_id:
            print("❌ Skipping - No product ID available")
            return False
            
        success, response = self.run_test(
            "Delete Product",
            "DELETE",
            f"products/{self.created_product_id}",
            200,
            token=self.admin_token
        )
        return success

    def test_auth_me_admin(self):
        """Test getting current user info for admin"""
        success, response = self.run_test(
            "Get Current User (Admin)",
            "GET",
            "auth/me",
            200,
            token=self.admin_token
        )
        return success and response.get('role') == 'admin'

    def test_auth_me_merchant(self):
        """Test getting current user info for merchant"""
        success, response = self.run_test(
            "Get Current User (Merchant)",
            "GET",
            "auth/me",
            200,
            token=self.merchant_token
        )
        return success and response.get('role') == 'merchant'

def main():
    print("🚀 Starting E-Commerce API Tests")
    print("=" * 50)
    
    tester = ECommerceAPITester()
    
    # Test sequence
    tests = [
        ("Admin Authentication", tester.test_admin_login),
        ("Merchant Authentication", tester.test_merchant_login),
        ("Admin User Info", tester.test_auth_me_admin),
        ("Merchant User Info", tester.test_auth_me_merchant),
        ("Get Products (Empty)", tester.test_get_products_empty),
        ("Create Product", tester.test_create_product),
        ("Get Products (With Data)", tester.test_get_products_with_data),
        ("Get Single Product", tester.test_get_single_product),
        ("Create Order", tester.test_create_order),
        ("Get Orders (Merchant)", tester.test_get_orders_as_merchant),
        ("Update Order Status", tester.test_update_order_status),
        ("Update Product Stock", tester.test_update_product_stock),
        ("Delete Product", tester.test_delete_product),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())