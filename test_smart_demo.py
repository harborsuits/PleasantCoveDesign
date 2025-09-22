#!/usr/bin/env python3
"""
Test the Smart Demo Generator with sample businesses
Run this to see personalized demos in action!
"""

import os
import webbrowser
from smart_demo_generator import generate_smart_demo

# Test businesses with different industries
TEST_BUSINESSES = [
    {
        'name': "Bob's Plumbing",
        'phone': '(207) 555-1234',
        'address': '123 Main St, Camden, ME',
        'city': 'Camden',
        'state': 'ME',
        'zip_code': '04843',
        'category': 'Plumber',
        'place_id': 'ChIJxxxxxxxxxxxxxx',
        'rating': 4.5,
        'review_count': 47,
        'email': 'bob@bobsplumbing.com'
    },
    {
        'name': "Coastal Seafood Restaurant",
        'phone': '(207) 555-5678',
        'address': '456 Harbor Rd, Bar Harbor, ME',
        'city': 'Bar Harbor',
        'state': 'ME',
        'zip_code': '04609',
        'category': 'Restaurant',
        'place_id': 'ChIJyyyyyyyyyyyy',
        'rating': 4.8,
        'review_count': 234,
        'email': 'info@coastalseafood.com'
    },
    {
        'name': "Green Thumb Landscaping",
        'phone': '(603) 555-9012',
        'address': '789 Garden Way, Portsmouth, NH',
        'city': 'Portsmouth',
        'state': 'NH',
        'zip_code': '03801',
        'category': 'Landscaping',
        'place_id': 'ChIJzzzzzzzzzzzz',
        'rating': 4.7,
        'review_count': 89,
        'email': 'contact@greenthumbnh.com'
    },
    {
        'name': "Smile Bright Dental",
        'phone': '(508) 555-3456',
        'address': '321 Health Plaza, Hyannis, MA',
        'city': 'Hyannis',
        'state': 'MA',
        'zip_code': '02601',
        'category': 'Dentist',
        'place_id': 'ChIJaaaaaaaaaaaa',
        'rating': 4.9,
        'review_count': 156,
        'email': 'appointments@smilebright.com'
    }
]

def test_demo_generation():
    """Generate demos for test businesses and display results"""
    print("🚀 Smart Demo Generator Test")
    print("=" * 50)
    print("\nGenerating personalized demos for test businesses...")
    print("\nNOTE: For full personalization, you'll need:")
    print("- Google Places API key (for real reviews/photos)")
    print("- OpenAI API key (for AI content)")
    print("- Weather API key (for local weather)")
    print("\nWithout APIs, using template content.\n")
    
    results = []
    
    for business in TEST_BUSINESSES:
        print(f"\n📍 Generating demo for {business['name']}...")
        print(f"   Location: {business['city']}, {business['state']}")
        print(f"   Industry: {business['category']}")
        print(f"   Rating: {business['rating']} ⭐ ({business['review_count']} reviews)")
        
        try:
            # Generate the demo
            result = generate_smart_demo(business)
            
            if 'error' not in result:
                print(f"   ✅ Demo generated successfully!")
                print(f"   📊 Personalization Score: {result['personalization_score']}%")
                print(f"   🔗 Demo URL: {result['demo_url']}")
                
                # Show key insights
                insights = result.get('insights', {})
                if insights.get('key_selling_points'):
                    print(f"   💡 Key Points: {', '.join(insights['key_selling_points'][:2])}")
                
                results.append({
                    'business': business['name'],
                    'url': result['demo_url'],
                    'score': result['personalization_score']
                })
            else:
                print(f"   ❌ Error: {result['error']}")
                
        except Exception as e:
            print(f"   ❌ Failed: {str(e)}")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 DEMO GENERATION SUMMARY")
    print("=" * 50)
    
    for result in results:
        print(f"\n{result['business']}:")
        print(f"  URL: {result['url']}")
        print(f"  Personalization: {result['score']}%")
    
    # Open the first demo in browser
    if results:
        print("\n" + "=" * 50)
        first_demo = results[0]['url']
        if os.path.exists(first_demo.replace('https://demos.pleasantcovedesign.com/', 'demos/generated/')):
            print(f"\n🌐 Opening {results[0]['business']} demo in browser...")
            webbrowser.open(f"file://{os.path.abspath(first_demo.replace('https://demos.pleasantcovedesign.com/', 'demos/generated/'))}")
        else:
            print(f"\n📁 Demos saved to: demos/generated/")
            print("   (Configure hosting to view them online)")
    
    # Show what the outreach would look like
    print("\n" + "=" * 50)
    print("📱 EXAMPLE OUTREACH MESSAGE")
    print("=" * 50)
    
    if results:
        first_business = TEST_BUSINESSES[0]
        print(f"\nSMS to {first_business['phone']}:")
        print(f"---")
        print(f"Hi {first_business['name']},")
        print(f"\nYour {first_business['rating']}★ reputation deserves a website!")
        print(f"\nI created a preview just for you:")
        print(f"{results[0]['url']}")
        print(f"\n- Ben from Pleasant Cove Design")
        print(f"---")

if __name__ == "__main__":
    test_demo_generation()
