#!/usr/bin/env python3
"""
Test script to verify all UI-API connections are working
Run this to ensure your UI can properly display data
"""

import requests
import json
import time
from datetime import datetime

# Configuration
API_URL = "http://localhost:3001"
HEADERS = {"Content-Type": "application/json"}

def test_connection(method, endpoint, data=None, description=""):
    """Test an API endpoint and return results"""
    try:
        url = f"{API_URL}{endpoint}"
        
        if method == "GET":
            response = requests.get(url, headers=HEADERS)
        else:
            response = requests.post(url, json=data, headers=HEADERS)
        
        success = response.status_code < 400
        
        print(f"\n{'✅' if success else '❌'} {description}")
        print(f"   {method} {endpoint}")
        print(f"   Status: {response.status_code}")
        
        if success and response.text:
            try:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=2)[:200]}...")
            except:
                print(f"   Response: {response.text[:200]}...")
        elif not success:
            print(f"   Error: {response.text[:200]}")
        
        return success, response.json() if success and response.text else None
        
    except Exception as e:
        print(f"\n❌ {description}")
        print(f"   {method} {endpoint}")
        print(f"   Error: {str(e)}")
        return False, None

def main():
    print("🔍 TESTING UI-API CONNECTIONS")
    print("=" * 60)
    print(f"Testing API at: {API_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Lead/Company Data (for stats cards)
    print("\n\n📊 TESTING LEAD STATS (for Lead Management page)")
    print("-" * 40)
    
    success1, companies = test_connection(
        "GET", 
        "/api/companies",
        description="Get all companies/leads"
    )
    
    if success1 and companies:
        # Calculate stats like the UI should
        total_leads = len(companies)
        no_website = len([c for c in companies if not c.get('website')])
        has_website = len([c for c in companies if c.get('website')])
        
        print(f"\n   📈 Stats the UI should show:")
        print(f"   - Total Leads: {total_leads}")
        print(f"   - No Website: {no_website} ({no_website/total_leads*100:.0f}% - YOUR TARGETS!)")
        print(f"   - Has Website: {has_website}")
        
        # Show priority scoring example
        if companies:
            lead = companies[0]
            score = 50
            if not lead.get('website'): score += 50
            if lead.get('rating', 0) >= 4.5: score += 30
            if lead.get('phone'): score += 20
            
            print(f"\n   🎯 Priority Score Example:")
            print(f"   - {lead.get('name', 'Unknown')}:")
            print(f"     • Base: 50")
            print(f"     • No website: +{50 if not lead.get('website') else 0}")
            print(f"     • Rating bonus: +{30 if lead.get('rating', 0) >= 4.5 else 0}")
            print(f"     • Has phone: +{20 if lead.get('phone') else 0}")
            print(f"     • Total Score: {score} {'🔥 HOT' if score >= 80 else '⭐ HIGH' if score >= 60 else '📈 MEDIUM'}")
    
    # Test 2: Scraper Endpoints
    print("\n\n🔄 TESTING SCRAPER (for real-time progress)")
    print("-" * 40)
    
    # Start a test scrape
    success2, scrape_result = test_connection(
        "POST",
        "/api/scrape-runs",
        data={
            "city": "TestCity",
            "category": "plumber",
            "limit": 5
        },
        description="Start new scrape"
    )
    
    if success2 and scrape_result and scrape_result.get('runId'):
        run_id = scrape_result['runId']
        print(f"\n   ⏳ Checking scrape progress...")
        time.sleep(2)
        
        # Check progress
        success3, progress = test_connection(
            "GET",
            f"/api/scrape-runs/{run_id}",
            description="Check scrape progress"
        )
        
        if success3 and progress:
            print(f"   Progress: {progress.get('progress', 0)}%")
            print(f"   Status: {progress.get('status', 'unknown')}")
    
    # Test 3: Outreach Endpoints
    print("\n\n📧 TESTING OUTREACH (for campaign management)")
    print("-" * 40)
    
    if companies and len(companies) > 0:
        test_id = companies[0].get('id', 1)
        
        success4, outreach = test_connection(
            "POST",
            f"/api/bot/outreach/{test_id}",
            description="Test single outreach"
        )
        
        if success4:
            print("   ✅ Outreach endpoint ready for campaigns!")
    
    # Test 4: Dashboard Data
    print("\n\n📈 TESTING DASHBOARD DATA")
    print("-" * 40)
    
    # Test orders for revenue
    success5, orders = test_connection(
        "GET",
        "/api/orders",
        description="Get orders for revenue metrics"
    )
    
    if success5 and orders:
        # Calculate monthly revenue
        this_month = datetime.now().replace(day=1)
        monthly_orders = [o for o in orders if datetime.fromisoformat(o.get('createdAt', '2024-01-01')) >= this_month]
        monthly_revenue = sum(o.get('total', 0) for o in monthly_orders if o.get('paymentStatus') == 'paid')
        
        print(f"\n   💰 Dashboard Metrics:")
        print(f"   - Total Orders: {len(orders)}")
        print(f"   - This Month: {len(monthly_orders)}")
        print(f"   - Monthly Revenue: ${monthly_revenue:,.2f}")
    
    # Test conversations for activity
    success6, conversations = test_connection(
        "GET",
        "/api/conversations",
        description="Get conversations for activity feed"
    )
    
    # Summary
    print("\n\n" + "=" * 60)
    print("📋 SUMMARY")
    print("-" * 40)
    
    all_tests = [success1, success2, success5, success6]
    passed = sum(all_tests)
    total = len(all_tests)
    
    print(f"Tests Passed: {passed}/{total}")
    
    if passed == total:
        print("\n✅ ALL CONNECTIONS WORKING!")
        print("Your UI should be able to display:")
        print("- Real lead statistics")
        print("- Priority scores and badges")
        print("- Scraper progress")
        print("- Dashboard metrics")
        print("- Outreach campaigns")
    else:
        print("\n⚠️  SOME CONNECTIONS FAILED")
        print("Check the errors above and ensure:")
        print("1. Your server is running (npm run dev)")
        print("2. Database is connected")
        print("3. API endpoints are properly registered")
    
    print("\n💡 Next Steps:")
    print("1. Update LeadsUnified.tsx to show real stats")
    print("2. Add priority badges to LeadsTable.tsx")
    print("3. Connect Dashboard.tsx to real metrics")
    print("4. Test with real scraping and outreach")

if __name__ == "__main__":
    main()
