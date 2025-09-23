#!/usr/bin/env python3
"""
Quick script to create a test project for Squarespace module testing
"""

import requests
import json

# Configuration
API_URL = "https://pcd-production-clean-production-e6f3.up.railway.app"
ADMIN_TOKEN = "pleasantcove2024admin"
TEST_EMAIL = "ben04537@gmail.com"  # Change this to your email

def create_test_project():
    print("🚀 Creating test project for Squarespace module...")
    
    # Step 1: Create or find company
    print("1️⃣ Creating company...")
    company_data = {
        "name": "Ben Test Company",
        "email": TEST_EMAIL,
        "phone": "(207) 555-0123",
        "address": "123 Test Street",
        "city": "Portland",
        "state": "ME",
        "industry": "Test Industry"
    }
    
    response = requests.post(
        f"{API_URL}/api/companies",
        json=company_data,
        params={"token": ADMIN_TOKEN}
    )
    
    if response.status_code == 201:
        company = response.json()
        print(f"✅ Company created: {company['name']} (ID: {company['id']})")
    else:
        # Try to find existing company
        response = requests.get(
            f"{API_URL}/api/companies",
            params={"token": ADMIN_TOKEN}
        )
        companies = response.json()
        company = next((c for c in companies if c.get('email') == TEST_EMAIL), None)
        if company:
            print(f"✅ Found existing company: {company['name']} (ID: {company['id']})")
        else:
            print("❌ Failed to create or find company")
            return
    
    # Step 2: Create project
    print("2️⃣ Creating project...")
    project_data = {
        "companyId": company['id'],
        "title": "Test Website Project",
        "type": "website",
        "stage": "active",
        "status": "active",
        "notes": "Test project for Squarespace module",
        "totalAmount": 4997,  # Professional package
        "paidAmount": 2499   # 50% deposit
    }
    
    response = requests.post(
        f"{API_URL}/api/projects",
        json=project_data,
        params={"token": ADMIN_TOKEN}
    )
    
    if response.status_code == 201:
        project = response.json()
        print(f"✅ Project created: {project['title']} (ID: {project['id']})")
        
        # Step 3: Generate token if needed
        if not project.get('accessToken'):
            print("3️⃣ Generating access token...")
            response = requests.post(
                f"{API_URL}/api/projects/{project['id']}/generate-token",
                headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
            )
            if response.ok:
                token_data = response.json()
                print(f"✅ Access token: {token_data['token']}")
    else:
        print(f"❌ Failed to create project: {response.text}")
        return
    
    print("\n🎉 Success! You can now:")
    print(f"1. Copy the updated SQUARESPACE_MODULE_PRODUCTION.html to Squarespace")
    print(f"2. Enter email: {TEST_EMAIL}")
    print(f"3. Your project will load!")

if __name__ == "__main__":
    create_test_project()
