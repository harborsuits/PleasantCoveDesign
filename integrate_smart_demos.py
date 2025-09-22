#!/usr/bin/env python3
"""
Integration Script - Connects Smart Demo Generator with existing outreach system
This bridges the gap between the enhanced demo generator and the current workflow
"""

import os
import logging
from smart_demo_generator import SmartDemoGenerator, generate_smart_demo
from demo_tracking_integration import DemoTrackingIntegration
from minerva_smart_outreach import MinervaSmartOutreach
from lead_tracker import LeadTracker

logger = logging.getLogger(__name__)

class EnhancedDemoOutreachSystem:
    """
    Integrates the Smart Demo Generator with the existing outreach infrastructure
    """
    
    def __init__(self):
        self.tracker = LeadTracker()
        self.tracking_integration = DemoTrackingIntegration()
        self.outreach = MinervaSmartOutreach()
        
        logger.info("🚀 Enhanced Demo Outreach System initialized")
    
    def generate_and_send_smart_demo(self, business_data: dict) -> dict:
        """
        Complete flow: Generate smart demo → Track it → Send outreach
        """
        try:
            # Step 1: Generate hyper-personalized demo
            logger.info(f"🎯 Generating smart demo for {business_data.get('name')}")
            
            # Use the enhanced smart demo generator
            smart_demo_result = generate_smart_demo(business_data)
            
            if 'error' in smart_demo_result:
                return {'error': f"Demo generation failed: {smart_demo_result['error']}"}
            
            # Step 2: Create tracking record
            lead_id = self.tracker.add_lead(
                business_data,
                smart_demo_result['demo_url'],
                f"smart_demo_{business_data.get('place_id', 'unknown')}"
            )
            
            # Step 3: Prepare demo result for outreach system
            demo_package = {
                'demo_id': smart_demo_result['demo_url'].split('/')[-1].replace('.html', ''),
                'demo_url': smart_demo_result['demo_url'],
                'tracking_url': f"{smart_demo_result['demo_url']}?lead_id={lead_id}",
                'lead_id': lead_id,
                'personalization_score': smart_demo_result['personalization_score'],
                'insights': smart_demo_result['insights'],
                'business_intel': smart_demo_result['business_intel']
            }
            
            # Step 4: Send personalized outreach
            logger.info("📧 Sending personalized outreach...")
            
            # Enhance outreach message with insights
            enhanced_business_data = {
                **business_data,
                'personalized_insights': smart_demo_result['insights']['key_selling_points'],
                'urgency_factors': smart_demo_result['insights']['urgency_factors'],
                'competitor_situation': smart_demo_result['insights']['competitor_situation']
            }
            
            outreach_result = self.tracking_integration.send_tracked_outreach(
                enhanced_business_data,
                demo_package
            )
            
            # Step 5: Log the complete action
            if outreach_result.get('sms_sent') or outreach_result.get('email_sent'):
                self.tracker.update_lead_status(
                    lead_id,
                    'smart_demo_sent',
                    f"Personalized demo sent (score: {smart_demo_result['personalization_score']}%)"
                )
            
            return {
                'success': True,
                'lead_id': lead_id,
                'demo_url': demo_package['tracking_url'],
                'personalization_score': smart_demo_result['personalization_score'],
                'outreach_sent': outreach_result,
                'insights': smart_demo_result['insights'],
                'next_steps': [
                    f"Monitor demo views for {business_data.get('name')}",
                    "Watch for engagement with personalized elements",
                    "Prepare follow-up based on insights"
                ]
            }
            
        except Exception as e:
            logger.error(f"❌ Failed in smart demo flow: {e}")
            return {'error': str(e)}
    
    def bulk_smart_demo_campaign(self, businesses: list, max_demos: int = 10) -> dict:
        """
        Run a campaign with smart demos for multiple businesses
        """
        results = {
            'campaign_id': f"smart_campaign_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'total_businesses': len(businesses),
            'demos_created': 0,
            'outreach_sent': 0,
            'errors': [],
            'results': []
        }
        
        # Process businesses (limit to max_demos)
        for business in businesses[:max_demos]:
            try:
                logger.info(f"Processing {business.get('name')}...")
                result = self.generate_and_send_smart_demo(business)
                
                if result.get('success'):
                    results['demos_created'] += 1
                    if result['outreach_sent'].get('sms_sent') or result['outreach_sent'].get('email_sent'):
                        results['outreach_sent'] += 1
                    results['results'].append(result)
                else:
                    results['errors'].append({
                        'business': business.get('name'),
                        'error': result.get('error')
                    })
                    
            except Exception as e:
                results['errors'].append({
                    'business': business.get('name'),
                    'error': str(e)
                })
        
        # Summary
        logger.info(f"✅ Campaign complete: {results['demos_created']} demos, {results['outreach_sent']} outreach sent")
        
        return results
    
    def get_enhanced_outreach_message(self, business_data: dict, demo_insights: dict) -> dict:
        """
        Create an enhanced outreach message using smart demo insights
        """
        urgency_factors = demo_insights.get('urgency_factors', [])
        key_points = demo_insights.get('key_selling_points', [])
        competitor_situation = demo_insights.get('competitor_situation', 'normal')
        
        # Build personalized message components
        urgency_line = urgency_factors[0] if urgency_factors else "Your business deserves a professional website"
        
        if competitor_situation == 'urgent':
            competitive_angle = "Don't let your competitors steal all the online customers!"
        else:
            competitive_angle = "Stand out from your competition online"
        
        # SMS Message
        sms_template = f"""Hi {business_data.get('name', 'there')}, 

{urgency_line}

I created a preview of what your website could look like: {{demo_url}}

{competitive_angle}

- Ben from Pleasant Cove Design"""
        
        # Email Message  
        email_template = f"""Subject: {business_data.get('name')} - {urgency_line}

Hi {business_data.get('name', 'there')},

{urgency_line}

I noticed your business and created a personalized preview of what your professional website could look like:
{{demo_url}}

{competitive_angle}

Key benefits for your business:
{chr(10).join(f'• {point}' for point in key_points[:3])}

The demo is personalized just for you - check it out and let me know what you think!

Best regards,
Ben
Pleasant Cove Design
(207) 555-0100
"""
        
        return {
            'sms': sms_template,
            'email': email_template
        }


# Configuration updater to use smart demos
def update_outreach_config_for_smart_demos():
    """
    Update the existing outreach system to use smart demos
    """
    config_updates = {
        'demo_generator': 'smart_demo_generator',
        'personalization_enabled': True,
        'competitor_analysis': True,
        'local_intel': True,
        'ai_content': True,
        'urgency_factors': True
    }
    
    # Save configuration
    import json
    with open('config/smart_demo_config.json', 'w') as f:
        json.dump(config_updates, f, indent=2)
    
    logger.info("✅ Configuration updated for smart demos")
    return config_updates


if __name__ == "__main__":
    import json
    from datetime import datetime
    
    print("🚀 Testing Enhanced Demo Outreach System")
    print("=" * 50)
    
    # Initialize system
    system = EnhancedDemoOutreachSystem()
    
    # Test business
    test_business = {
        'name': "Bob's Plumbing",
        'phone': '(207) 555-1234',
        'address': '123 Main St, Camden, ME',
        'city': 'Camden',
        'state': 'ME',
        'zip_code': '04843',
        'category': 'Plumber',
        'place_id': 'ChIJxxxxxxxxxxxxxx',
        'email': 'bob@bobsplumbing.com',
        'rating': 4.5,
        'review_count': 47
    }
    
    # Test single smart demo
    print("\n1. Testing single smart demo generation and outreach...")
    result = system.generate_and_send_smart_demo(test_business)
    
    if result.get('success'):
        print(f"   ✅ Demo created with {result['personalization_score']}% personalization")
        print(f"   ✅ Tracking URL: {result['demo_url']}")
        print(f"   ✅ Lead ID: {result['lead_id']}")
        print(f"   ✅ Key insights: {', '.join(result['insights']['key_selling_points'][:2])}")
        print(f"   ✅ Outreach sent: SMS={result['outreach_sent']['sms_sent']}, Email={result['outreach_sent']['email_sent']}")
    else:
        print(f"   ❌ Error: {result.get('error')}")
    
    # Test bulk campaign
    print("\n2. Testing bulk smart demo campaign...")
    test_businesses = [
        {
            'name': "Camden Family Dental",
            'phone': '(207) 555-2222',
            'address': '456 Harbor Rd, Camden, ME',
            'city': 'Camden',
            'state': 'ME',
            'category': 'Dentist',
            'rating': 4.8,
            'review_count': 120
        },
        {
            'name': "Coastal Landscaping",
            'phone': '(207) 555-3333',
            'address': '789 Ocean Ave, Rockport, ME',
            'city': 'Rockport',
            'state': 'ME',
            'category': 'Landscaping',
            'rating': 4.6,
            'review_count': 85
        }
    ]
    
    campaign_result = system.bulk_smart_demo_campaign(test_businesses, max_demos=2)
    print(f"   ✅ Campaign ID: {campaign_result['campaign_id']}")
    print(f"   ✅ Demos created: {campaign_result['demos_created']}/{campaign_result['total_businesses']}")
    print(f"   ✅ Outreach sent: {campaign_result['outreach_sent']}")
    print(f"   ✅ Errors: {len(campaign_result['errors'])}")
    
    # Update configuration
    print("\n3. Updating system configuration...")
    config = update_outreach_config_for_smart_demos()
    print("   ✅ Configuration updated")
    
    print("\n🎉 Enhanced Demo Outreach System is ready!")
    print("\nNext steps:")
    print("1. Set up environment variables (API keys)")
    print("2. Configure demo hosting (Cloudflare R2)")
    print("3. Test with real business data")
    print("4. Monitor engagement metrics")
