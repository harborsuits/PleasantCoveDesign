#!/usr/bin/env python3
"""
Smart Demo Generator - Creates hyper-personalized website demos for prospects
Uses business intelligence, competitor analysis, and AI to maximize conversions
"""

import os
import json
import time
import random
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import sqlite3
from dataclasses import dataclass
from jinja2 import Template
import openai
from bs4 import BeautifulSoup
import re

# Configuration
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', '')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
WEATHER_API_KEY = os.getenv('WEATHER_API_KEY', '')
PEXELS_API_KEY = os.getenv('PEXELS_API_KEY', '')

@dataclass
class BusinessIntel:
    """Enhanced business data with all gathered intelligence"""
    # Basic info (from scraper)
    name: str
    phone: str
    address: str
    city: str
    state: str
    zip_code: str
    category: str
    place_id: str
    
    # Enhanced data
    rating: float = 0.0
    review_count: int = 0
    reviews: List[Dict] = None
    hours: Dict[str, str] = None
    services: List[str] = None
    photos: List[str] = None
    competitors: List[Dict] = None
    website_status: str = 'none'
    established_year: Optional[int] = None
    price_level: Optional[str] = None
    
    # Local data
    weather: Dict = None
    local_events: List[Dict] = None
    demographics: Dict = None
    landmarks: List[str] = None
    
    # Generated insights
    missed_customers: int = 0
    revenue_potential: Tuple[int, int] = (0, 0)
    competitor_advantages: List[str] = None
    urgency_factors: List[str] = None

class SmartDemoGenerator:
    """Generates hyper-personalized demo websites based on comprehensive business intelligence"""
    
    def __init__(self, business_data: Dict):
        self.business = BusinessIntel(**business_data)
        self.template_dir = "templates/industries"
        self.output_dir = "demos/generated"
        self.assets_dir = "demos/assets"
        
        # Initialize AI
        if OPENAI_API_KEY:
            openai.api_key = OPENAI_API_KEY
        
        # Create directories
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.assets_dir, exist_ok=True)
        
    def generate_smart_demo(self) -> Dict:
        """Main method to generate a hyper-personalized demo"""
        print(f"🎯 Generating smart demo for {self.business.name}...")
        
        # 1. Gather comprehensive intelligence
        self.gather_business_intel()
        
        # 2. Analyze competition
        self.analyze_local_competition()
        
        # 3. Generate personalized content
        self.create_personalized_content()
        
        # 4. Select smart features
        self.select_industry_features()
        
        # 5. Gather visual assets
        self.gather_visual_assets()
        
        # 6. Add conversion triggers
        self.add_urgency_elements()
        
        # 7. Build the demo
        demo_url = self.build_demo_site()
        
        # 8. Generate insights report
        insights = self.generate_insights_report()
        
        return {
            'demo_url': demo_url,
            'business_intel': self.business.__dict__,
            'insights': insights,
            'personalization_score': self.calculate_personalization_score()
        }
    
    def gather_business_intel(self):
        """Gather comprehensive intelligence about the business"""
        print("📊 Gathering business intelligence...")
        
        # Get Google Places details
        if GOOGLE_MAPS_API_KEY and self.business.place_id:
            self.fetch_google_places_details()
        
        # Get weather for location
        self.fetch_local_weather()
        
        # Estimate missed customers
        self.calculate_missed_opportunities()
        
        # Find local landmarks
        self.identify_local_landmarks()
        
    def fetch_google_places_details(self):
        """Fetch detailed info from Google Places API"""
        url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            'place_id': self.business.place_id,
            'fields': 'rating,user_ratings_total,reviews,opening_hours,photos,price_level',
            'key': GOOGLE_MAPS_API_KEY
        }
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if data.get('result'):
                result = data['result']
                
                # Rating and reviews
                self.business.rating = result.get('rating', 0)
                self.business.review_count = result.get('user_ratings_total', 0)
                
                # Top reviews
                if 'reviews' in result:
                    self.business.reviews = sorted(
                        result['reviews'], 
                        key=lambda x: x.get('rating', 0), 
                        reverse=True
                    )[:5]  # Top 5 reviews
                
                # Business hours
                if 'opening_hours' in result:
                    self.business.hours = result['opening_hours'].get('weekday_text', [])
                
                # Price level
                price_level = result.get('price_level', 2)
                self.business.price_level = ['Budget', 'Affordable', 'Moderate', 'Upscale', 'Premium'][price_level]
                
                # Photos
                if 'photos' in result:
                    self.business.photos = [
                        f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference={photo['photo_reference']}&key={GOOGLE_MAPS_API_KEY}"
                        for photo in result['photos'][:5]
                    ]
                    
        except Exception as e:
            print(f"❌ Error fetching Google Places details: {e}")
    
    def analyze_local_competition(self):
        """Analyze local competitors"""
        print("🔍 Analyzing local competition...")
        
        if not GOOGLE_MAPS_API_KEY:
            return
        
        # Search for similar businesses nearby
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            'location': f"{self.business.address}",
            'radius': 5000,  # 5km radius
            'type': self.business.category.lower().replace(' ', '_'),
            'key': GOOGLE_MAPS_API_KEY
        }
        
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            competitors = []
            competitor_advantages = []
            
            for place in data.get('results', [])[:10]:
                if place['name'] != self.business.name:
                    competitor = {
                        'name': place['name'],
                        'rating': place.get('rating', 0),
                        'review_count': place.get('user_ratings_total', 0),
                        'has_website': 'website' in place.get('types', [])
                    }
                    competitors.append(competitor)
                    
                    # Track advantages competitors have
                    if competitor['rating'] > 4.5:
                        competitor_advantages.append(f"{competitor['name']} has {competitor['rating']} star rating")
                    if competitor['has_website']:
                        competitor_advantages.append(f"{competitor['name']} has a website")
            
            self.business.competitors = competitors
            self.business.competitor_advantages = competitor_advantages[:5]  # Top 5 advantages
            
            # Count competitors with websites
            web_competitors = sum(1 for c in competitors if c['has_website'])
            if web_competitors > 0:
                self.business.urgency_factors = self.business.urgency_factors or []
                self.business.urgency_factors.append(
                    f"{web_competitors} competitors in {self.business.city} already have websites"
                )
                
        except Exception as e:
            print(f"❌ Error analyzing competition: {e}")
    
    def create_personalized_content(self):
        """Generate personalized content using AI"""
        print("✍️ Creating personalized content...")
        
        # Extract services from reviews and category
        self.extract_services()
        
        # Generate AI content if available
        if OPENAI_API_KEY:
            self.generate_ai_content()
        else:
            self.generate_template_content()
    
    def extract_services(self):
        """Extract services from reviews and business category"""
        services = set()
        
        # Category-based services
        category_services = {
            'plumber': ['Emergency Plumbing', 'Drain Cleaning', 'Water Heater Repair', 
                       'Pipe Installation', 'Leak Detection', 'Bathroom Remodeling'],
            'restaurant': ['Dine-In', 'Takeout', 'Delivery', 'Catering', 
                          'Private Events', 'Online Ordering'],
            'dentist': ['Cleanings', 'Fillings', 'Crowns', 'Whitening', 
                       'Emergency Care', 'Cosmetic Dentistry'],
            'electrician': ['Wiring', 'Panel Upgrades', 'Lighting Installation', 
                           'Emergency Repairs', 'Home Inspections', 'EV Chargers'],
            'landscaping': ['Lawn Care', 'Tree Service', 'Garden Design', 
                           'Hardscaping', 'Irrigation', 'Snow Removal'],
            'auto_repair': ['Oil Changes', 'Brake Service', 'Engine Repair', 
                           'Tire Service', 'AC Repair', 'Diagnostics']
        }
        
        # Add category-specific services
        for key, svcs in category_services.items():
            if key in self.business.category.lower():
                services.update(svcs)
                break
        
        # Extract from reviews if available
        if self.business.reviews:
            service_keywords = ['fixed', 'installed', 'repaired', 'cleaned', 
                              'replaced', 'serviced', 'helped with']
            for review in self.business.reviews:
                text = review.get('text', '').lower()
                for keyword in service_keywords:
                    if keyword in text:
                        # Extract the service mentioned after the keyword
                        parts = text.split(keyword)
                        if len(parts) > 1:
                            service_mention = parts[1].split('.')[0].strip()
                            if len(service_mention) < 50:  # Reasonable length
                                services.add(service_mention.title())
        
        self.business.services = list(services)[:8]  # Top 8 services
    
    def generate_ai_content(self):
        """Generate content using OpenAI"""
        try:
            # Homepage hero section
            hero_prompt = f"""
            Write a compelling homepage hero section for {self.business.name}, 
            a {self.business.category} business in {self.business.city}, {self.business.state}.
            
            Include:
            - A powerful headline (max 10 words)
            - A subheadline that mentions their location and expertise (max 20 words)
            - A call-to-action button text
            
            Make it feel local and personal. Format as JSON with keys: headline, subheadline, cta
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a expert copywriter for local businesses."},
                    {"role": "user", "content": hero_prompt}
                ],
                temperature=0.7
            )
            
            hero_content = json.loads(response.choices[0].message.content)
            self.business.hero_content = hero_content
            
            # About section
            about_prompt = f"""
            Write a brief, compelling about section for {self.business.name}.
            They are a {self.business.category} serving {self.business.city} and surrounding areas.
            
            Key points to potentially include:
            - {self.business.rating} star rating with {self.business.review_count} reviews
            - Services: {', '.join(self.business.services[:3])}
            - Local expertise and community focus
            
            Keep it to 2-3 sentences. Make it warm and trustworthy.
            """
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a expert copywriter for local businesses."},
                    {"role": "user", "content": about_prompt}
                ],
                temperature=0.7
            )
            
            self.business.about_content = response.choices[0].message.content
            
        except Exception as e:
            print(f"❌ Error generating AI content: {e}")
            self.generate_template_content()
    
    def generate_template_content(self):
        """Fallback template-based content generation"""
        self.business.hero_content = {
            'headline': f"Your Trusted {self.business.category} in {self.business.city}",
            'subheadline': f"Professional {self.business.category.lower()} services for {self.business.city} and surrounding areas",
            'cta': "Get Free Quote"
        }
        
        self.business.about_content = f"""
        {self.business.name} has been proudly serving {self.business.city} with 
        top-quality {self.business.category.lower()} services. With {self.business.rating} stars 
        and {self.business.review_count} satisfied customers, we're your local experts.
        """
    
    def fetch_local_weather(self):
        """Get current weather for the business location"""
        if not WEATHER_API_KEY:
            return
            
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather"
            params = {
                'q': f"{self.business.city},{self.business.state}",
                'appid': WEATHER_API_KEY,
                'units': 'imperial'
            }
            
            response = requests.get(url, params=params)
            data = response.json()
            
            if response.status_code == 200:
                self.business.weather = {
                    'temp': round(data['main']['temp']),
                    'description': data['weather'][0]['description'],
                    'icon': data['weather'][0]['icon']
                }
                
        except Exception as e:
            print(f"❌ Error fetching weather: {e}")
    
    def calculate_missed_opportunities(self):
        """Calculate potential missed customers and revenue"""
        # Industry-specific search volumes (monthly estimates)
        search_volumes = {
            'plumber': 150,
            'restaurant': 500,
            'dentist': 200,
            'electrician': 120,
            'landscaping': 180,
            'auto_repair': 250
        }
        
        # Get base search volume for category
        base_volume = 100  # default
        for key, volume in search_volumes.items():
            if key in self.business.category.lower():
                base_volume = volume
                break
        
        # Adjust for city size (rough estimate)
        # You could use census data API for accurate numbers
        city_multiplier = 1.0  # default for average city
        
        # Calculate missed opportunities
        # Assume 70% of searches go to businesses with websites
        monthly_missed = int(base_volume * city_multiplier * 0.7)
        self.business.missed_customers = monthly_missed
        
        # Calculate revenue potential
        # Industry-specific average transaction values
        avg_transaction = {
            'plumber': 350,
            'restaurant': 45,
            'dentist': 200,
            'electrician': 400,
            'landscaping': 300,
            'auto_repair': 450
        }
        
        avg_value = 200  # default
        for key, value in avg_transaction.items():
            if key in self.business.category.lower():
                avg_value = value
                break
        
        # Conservative conversion estimate: 2-5% of website visitors
        min_revenue = int(monthly_missed * 0.02 * avg_value)
        max_revenue = int(monthly_missed * 0.05 * avg_value)
        
        self.business.revenue_potential = (min_revenue, max_revenue)
        
        # Add urgency factor
        if self.business.urgency_factors is None:
            self.business.urgency_factors = []
        
        self.business.urgency_factors.append(
            f"Missing ~{monthly_missed} potential customers every month"
        )
    
    def identify_local_landmarks(self):
        """Identify local landmarks for content personalization"""
        # This would ideally use a landmarks API
        # For now, use common patterns
        
        landmarks = []
        
        # Coastal cities
        coastal_keywords = ['beach', 'harbor', 'port', 'coast', 'bay']
        if any(keyword in self.business.city.lower() for keyword in coastal_keywords):
            landmarks.append(f"{self.business.city} Harbor")
            landmarks.append("the waterfront")
        
        # Add state-specific landmarks
        state_landmarks = {
            'ME': ['Acadia National Park', 'Old Port', 'Casco Bay'],
            'NY': ['Central Park', 'Times Square', 'Hudson River'],
            'CA': ['Golden Gate', 'Pacific Coast', 'Wine Country'],
            'FL': ['the beaches', 'downtown', 'the Keys']
        }
        
        if self.business.state in state_landmarks:
            landmarks.extend(state_landmarks[self.business.state])
        
        self.business.landmarks = landmarks[:3]  # Top 3 landmarks
    
    def select_industry_features(self):
        """Select smart features based on industry"""
        print("🎛️ Selecting industry-specific features...")
        
        # Industry-specific must-have features
        feature_sets = {
            'plumber': {
                'emergency_contact': True,
                'service_area_map': True,
                'online_booking': True,
                'price_calculator': True,
                'before_after_gallery': True,
                'license_display': True
            },
            'restaurant': {
                'online_menu': True,
                'reservations': True,
                'delivery_integration': True,
                'photo_gallery': True,
                'reviews_display': True,
                'hours_prominent': True
            },
            'dentist': {
                'appointment_booking': True,
                'patient_forms': True,
                'insurance_info': True,
                'team_profiles': True,
                'services_grid': True,
                'patient_reviews': True
            },
            'electrician': {
                'emergency_service': True,
                'service_areas': True,
                'safety_tips': True,
                'project_gallery': True,
                'certifications': True,
                'quote_request': True
            },
            'landscaping': {
                'portfolio_gallery': True,
                'seasonal_services': True,
                'maintenance_plans': True,
                'quote_calculator': True,
                'design_consultation': True,
                'service_areas': True
            },
            'auto_repair': {
                'appointment_system': True,
                'services_list': True,
                'coupons_section': True,
                'car_care_tips': True,
                'warranty_info': True,
                'towing_service': True
            }
        }
        
        # Select features based on category
        self.business.features = feature_sets.get('default', {})
        for key, features in feature_sets.items():
            if key in self.business.category.lower():
                self.business.features = features
                break
        
        # Add universal features
        self.business.features.update({
            'mobile_responsive': True,
            'contact_forms': True,
            'social_media': True,
            'seo_optimized': True,
            'fast_loading': True,
            'ssl_secure': True
        })
    
    def gather_visual_assets(self):
        """Gather industry-appropriate images"""
        print("🖼️ Gathering visual assets...")
        
        # If we have Google Photos, download them
        if self.business.photos:
            self.download_business_photos()
        
        # Get stock photos as fallback
        self.fetch_stock_photos()
        
    def download_business_photos(self):
        """Download actual business photos from Google"""
        if not self.business.photos:
            return
            
        photo_paths = []
        for i, photo_url in enumerate(self.business.photos[:3]):
            try:
                response = requests.get(photo_url)
                if response.status_code == 200:
                    filename = f"{self.business.name.replace(' ', '_')}_{i}.jpg"
                    filepath = os.path.join(self.assets_dir, filename)
                    
                    with open(filepath, 'wb') as f:
                        f.write(response.content)
                    
                    photo_paths.append(filepath)
                    
            except Exception as e:
                print(f"❌ Error downloading photo: {e}")
        
        self.business.local_photos = photo_paths
    
    def fetch_stock_photos(self):
        """Fetch relevant stock photos from Pexels"""
        if not PEXELS_API_KEY:
            return
            
        headers = {'Authorization': PEXELS_API_KEY}
        
        # Search for industry-relevant photos
        search_terms = [
            self.business.category,
            f"{self.business.category} {self.business.city}",
            f"professional {self.business.category}"
        ]
        
        stock_photos = []
        
        for term in search_terms:
            try:
                url = "https://api.pexels.com/v1/search"
                params = {
                    'query': term,
                    'per_page': 5,
                    'orientation': 'landscape'
                }
                
                response = requests.get(url, headers=headers, params=params)
                data = response.json()
                
                for photo in data.get('photos', []):
                    stock_photos.append({
                        'url': photo['src']['large'],
                        'alt': photo['alt'],
                        'photographer': photo['photographer']
                    })
                    
            except Exception as e:
                print(f"❌ Error fetching stock photos: {e}")
        
        self.business.stock_photos = stock_photos[:10]  # Keep top 10
    
    def add_urgency_elements(self):
        """Add psychological triggers to encourage action"""
        print("⚡ Adding urgency elements...")
        
        if self.business.urgency_factors is None:
            self.business.urgency_factors = []
        
        # Time-based urgency
        current_month = datetime.now().strftime('%B')
        self.business.urgency_factors.extend([
            f"Special {current_month} pricing ends soon",
            "Limited spots available for new websites this month",
            f"Join {self.business.review_count}+ happy customers"
        ])
        
        # Competitor-based urgency
        if self.business.competitors:
            with_websites = sum(1 for c in self.business.competitors if c.get('has_website'))
            if with_websites > 0:
                self.business.urgency_factors.append(
                    f"{with_websites} of your competitors are already online"
                )
        
        # Opportunity cost
        min_rev, max_rev = self.business.revenue_potential
        if min_rev > 0:
            self.business.urgency_factors.append(
                f"Potentially missing ${min_rev:,}-${max_rev:,}/month in revenue"
            )
        
        # Social proof
        if self.business.rating >= 4.5:
            self.business.urgency_factors.append(
                f"Your {self.business.rating}★ reputation deserves a professional website"
            )
        
        # Random live element (changes each visit)
        live_elements = [
            "2 people viewed this demo in the last hour",
            "Another business in your area just signed up",
            f"3 customers searched for '{self.business.category} near me' while you read this"
        ]
        self.business.live_urgency = random.choice(live_elements)
    
    def build_demo_site(self):
        """Generate the actual demo website"""
        print("🏗️ Building demo site...")
        
        # Select template based on industry
        template_name = self.select_template()
        
        # Load and render template
        template_path = os.path.join(self.template_dir, f"{template_name}.html")
        
        # If template doesn't exist, use default
        if not os.path.exists(template_path):
            template_path = os.path.join(self.template_dir, "default.html")
        
        # Create demo HTML
        demo_content = self.render_template(template_path)
        
        # Save demo
        safe_name = re.sub(r'[^a-z0-9-]', '-', self.business.name.lower())
        demo_filename = f"{safe_name}-{int(time.time())}.html"
        demo_path = os.path.join(self.output_dir, demo_filename)
        
        with open(demo_path, 'w', encoding='utf-8') as f:
            f.write(demo_content)
        
        # Generate demo URL
        demo_url = f"https://demos.pleasantcovedesign.com/{demo_filename}"
        
        print(f"✅ Demo created: {demo_url}")
        
        return demo_url
    
    def select_template(self):
        """Select the best template for this business type"""
        # Map categories to templates
        template_map = {
            'plumber': 'service-pro',
            'restaurant': 'restaurant',
            'dentist': 'medical',
            'electrician': 'service-pro',
            'landscaping': 'outdoor-services',
            'auto_repair': 'automotive'
        }
        
        for key, template in template_map.items():
            if key in self.business.category.lower():
                return template
        
        return 'default'
    
    def render_template(self, template_path):
        """Render the template with all personalized data"""
        # For now, create a comprehensive demo HTML
        # In production, you'd use Jinja2 or similar
        
        demo_html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{self.business.name} - {self.business.category} in {self.business.city}, {self.business.state}</title>
    <meta name="description" content="{self.business.about_content}">
    
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
        }}
        
        .demo-banner {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            text-align: center;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        
        .demo-banner h2 {{
            font-size: 20px;
            margin-bottom: 5px;
        }}
        
        .demo-banner p {{
            font-size: 16px;
            opacity: 0.9;
        }}
        
        .urgency-ticker {{
            background: #ff6b6b;
            color: white;
            padding: 8px;
            text-align: center;
            font-size: 14px;
        }}
        
        header {{
            background: white;
            padding: 20px 0;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }}
        
        .header-content {{
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        
        .logo {{
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
        }}
        
        .contact-header {{
            display: flex;
            align-items: center;
            gap: 20px;
        }}
        
        .phone-cta {{
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: bold;
            transition: transform 0.2s;
        }}
        
        .phone-cta:hover {{
            transform: scale(1.05);
        }}
        
        .hero {{
            background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), 
                        url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600"><rect fill="%23667eea" width="1200" height="600"/></svg>');
            background-size: cover;
            background-position: center;
            color: white;
            padding: 100px 0;
            text-align: center;
        }}
        
        .hero h1 {{
            font-size: 48px;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }}
        
        .hero p {{
            font-size: 24px;
            margin-bottom: 30px;
            opacity: 0.95;
        }}
        
        .cta-button {{
            display: inline-block;
            background: #ff6b6b;
            color: white;
            padding: 15px 40px;
            font-size: 20px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(255,107,107,0.3);
        }}
        
        .cta-button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255,107,107,0.4);
        }}
        
        .trust-indicators {{
            background: #f8f9fa;
            padding: 30px 0;
            text-align: center;
        }}
        
        .trust-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
            margin-top: 20px;
        }}
        
        .trust-item {{
            text-align: center;
        }}
        
        .trust-item .number {{
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
        }}
        
        .trust-item .label {{
            color: #666;
            margin-top: 5px;
        }}
        
        .services {{
            padding: 60px 0;
        }}
        
        .services h2 {{
            text-align: center;
            font-size: 36px;
            margin-bottom: 40px;
            color: #333;
        }}
        
        .services-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
        }}
        
        .service-card {{
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            text-align: center;
            transition: transform 0.3s;
        }}
        
        .service-card:hover {{
            transform: translateY(-5px);
        }}
        
        .service-icon {{
            font-size: 48px;
            margin-bottom: 15px;
        }}
        
        .reviews {{
            background: #f8f9fa;
            padding: 60px 0;
        }}
        
        .reviews h2 {{
            text-align: center;
            font-size: 36px;
            margin-bottom: 40px;
        }}
        
        .review-card {{
            background: white;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.05);
        }}
        
        .review-stars {{
            color: #ffc107;
            margin-bottom: 10px;
        }}
        
        .review-text {{
            color: #666;
            line-height: 1.6;
            margin-bottom: 10px;
        }}
        
        .review-author {{
            font-weight: bold;
            color: #333;
        }}
        
        .roi-calculator {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 0;
            text-align: center;
        }}
        
        .roi-calculator h2 {{
            font-size: 36px;
            margin-bottom: 20px;
        }}
        
        .roi-numbers {{
            display: flex;
            justify-content: center;
            gap: 50px;
            margin-top: 30px;
            flex-wrap: wrap;
        }}
        
        .roi-item {{
            text-align: center;
        }}
        
        .roi-item .amount {{
            font-size: 48px;
            font-weight: bold;
        }}
        
        .roi-item .desc {{
            opacity: 0.9;
            margin-top: 5px;
        }}
        
        .competitor-alert {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            margin: 40px 0;
            border-radius: 5px;
        }}
        
        .competitor-alert h3 {{
            color: #856404;
            margin-bottom: 10px;
        }}
        
        .competitor-alert ul {{
            color: #856404;
            margin-left: 20px;
        }}
        
        .final-cta {{
            background: #333;
            color: white;
            padding: 80px 0;
            text-align: center;
        }}
        
        .final-cta h2 {{
            font-size: 42px;
            margin-bottom: 20px;
        }}
        
        .final-cta p {{
            font-size: 20px;
            margin-bottom: 30px;
            opacity: 0.9;
        }}
        
        .limited-time {{
            background: #ff6b6b;
            display: inline-block;
            padding: 10px 20px;
            border-radius: 25px;
            margin-bottom: 20px;
            font-weight: bold;
        }}
        
        .weather-widget {{
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            font-size: 14px;
        }}
        
        @media (max-width: 768px) {{
            .hero h1 {{
                font-size: 32px;
            }}
            
            .hero p {{
                font-size: 18px;
            }}
            
            .roi-numbers {{
                flex-direction: column;
                gap: 30px;
            }}
        }}
    </style>
</head>
<body>
    <!-- Demo Banner -->
    <div class="demo-banner">
        <h2>🎯 This is YOUR Website Demo!</h2>
        <p>See what {self.business.name} could look like online</p>
    </div>
    
    <!-- Urgency Ticker -->
    <div class="urgency-ticker">
        ⚡ {self.business.live_urgency} ⚡
    </div>
    
    <!-- Header -->
    <header>
        <div class="container">
            <div class="header-content">
                <div class="logo">{self.business.name}</div>
                <div class="contact-header">
                    <span>{'⭐' * int(self.business.rating)} {self.business.rating} ({self.business.review_count} reviews)</span>
                    <a href="tel:{self.business.phone}" class="phone-cta">📞 {self.business.phone}</a>
                </div>
            </div>
        </div>
    </header>
    
    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <h1>{self.business.hero_content.get('headline', f'Welcome to {self.business.name}')}</h1>
            <p>{self.business.hero_content.get('subheadline', f'Your trusted {self.business.category} in {self.business.city}')}</p>
            <a href="#contact" class="cta-button">{self.business.hero_content.get('cta', 'Get Your Free Quote')}</a>
        </div>
    </section>
    
    <!-- Trust Indicators -->
    <section class="trust-indicators">
        <div class="container">
            <h2>Why {self.business.city} Trusts Us</h2>
            <div class="trust-grid">
                <div class="trust-item">
                    <div class="number">{self.business.rating}</div>
                    <div class="label">Star Rating</div>
                </div>
                <div class="trust-item">
                    <div class="number">{self.business.review_count}</div>
                    <div class="label">Happy Customers</div>
                </div>
                <div class="trust-item">
                    <div class="number">{random.randint(5, 15)}+</div>
                    <div class="label">Years Experience</div>
                </div>
                <div class="trust-item">
                    <div class="number">24/7</div>
                    <div class="label">Availability</div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Services -->
    <section class="services">
        <div class="container">
            <h2>Our Services</h2>
            <div class="services-grid">
                {self.generate_services_html()}
            </div>
        </div>
    </section>
    
    <!-- Reviews Section -->
    <section class="reviews">
        <div class="container">
            <h2>What {self.business.city} Residents Say</h2>
            {self.generate_reviews_html()}
        </div>
    </section>
    
    <!-- ROI Calculator -->
    <section class="roi-calculator">
        <div class="container">
            <h2>What You're Missing Without a Website</h2>
            <div class="roi-numbers">
                <div class="roi-item">
                    <div class="amount">~{self.business.missed_customers}</div>
                    <div class="desc">Potential customers/month</div>
                </div>
                <div class="roi-item">
                    <div class="amount">${self.business.revenue_potential[0]:,}+</div>
                    <div class="desc">Monthly revenue potential</div>
                </div>
                <div class="roi-item">
                    <div class="amount">70%</div>
                    <div class="desc">Of customers search online first</div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Competitor Alert -->
    {self.generate_competitor_alert()}
    
    <!-- Final CTA -->
    <section class="final-cta" id="contact">
        <div class="container">
            <div class="limited-time">Limited Time Offer - {datetime.now().strftime('%B')} Special</div>
            <h2>Ready to Dominate {self.business.city} Online?</h2>
            <p>Join the smart business owners who are already capturing online customers</p>
            <a href="#" class="cta-button" onclick="window.parent.postMessage('openChat', '*')">Let's Build Your Website</a>
        </div>
    </section>
    
    <!-- Weather Widget -->
    {self.generate_weather_widget()}
    
    <script>
        // Add live interactions
        document.addEventListener('DOMContentLoaded', function() {{
            // Animate numbers on scroll
            const observerOptions = {{
                threshold: 0.5
            }};
            
            const observer = new IntersectionObserver((entries) => {{
                entries.forEach(entry => {{
                    if (entry.isIntersecting) {{
                        entry.target.classList.add('animated');
                    }}
                }});
            }}, observerOptions);
            
            document.querySelectorAll('.number, .amount').forEach(el => {{
                observer.observe(el);
            }});
            
            // Update urgency ticker
            const urgencyMessages = [
                "2 people are viewing this demo right now",
                "Another {self.business.city} business just got a website",
                "3 customers searched for '{self.business.category}' while you read this",
                "{random.randint(5,15)} missed calls this week from online searches"
            ];
            
            let currentMessage = 0;
            setInterval(() => {{
                currentMessage = (currentMessage + 1) % urgencyMessages.length;
                document.querySelector('.urgency-ticker').innerHTML = `⚡ ${{urgencyMessages[currentMessage]}} ⚡`;
            }}, 5000);
            
            // Track time on page
            let timeOnPage = 0;
            setInterval(() => {{
                timeOnPage++;
                if (timeOnPage === 30) {{
                    alert("👋 Still here? Let's talk about getting your actual website live!");
                }}
            }}, 1000);
        }});
    </script>
</body>
</html>
        """
        
        return demo_html
    
    def generate_services_html(self):
        """Generate HTML for services section"""
        if not self.business.services:
            return "<p>Professional services tailored to your needs</p>"
        
        html = ""
        icons = ['🔧', '🛠️', '⚡', '🏠', '💼', '✅', '🎯', '⭐']
        
        for i, service in enumerate(self.business.services[:6]):
            icon = icons[i % len(icons)]
            html += f"""
                <div class="service-card">
                    <div class="service-icon">{icon}</div>
                    <h3>{service}</h3>
                    <p>Professional {service.lower()} services for {self.business.city} and surrounding areas</p>
                </div>
            """
        
        return html
    
    def generate_reviews_html(self):
        """Generate HTML for reviews section"""
        if not self.business.reviews:
            # Generate sample reviews
            return f"""
                <div class="review-card">
                    <div class="review-stars">⭐⭐⭐⭐⭐</div>
                    <div class="review-text">
                        "Best {self.business.category.lower()} in {self.business.city}! 
                        Professional, reliable, and fair pricing. Highly recommend!"
                    </div>
                    <div class="review-author">- Local Resident</div>
                </div>
            """
        
        html = ""
        for review in self.business.reviews[:3]:
            stars = '⭐' * review.get('rating', 5)
            html += f"""
                <div class="review-card">
                    <div class="review-stars">{stars}</div>
                    <div class="review-text">{review.get('text', '')[:200]}...</div>
                    <div class="review-author">- {review.get('author_name', 'Verified Customer')}</div>
                </div>
            """
        
        return html
    
    def generate_competitor_alert(self):
        """Generate competitor alert section"""
        if not self.business.competitor_advantages:
            return ""
        
        return f"""
            <div class="container">
                <div class="competitor-alert">
                    <h3>⚠️ Your Competition is Already Online</h3>
                    <ul>
                        {''.join(f'<li>{adv}</li>' for adv in self.business.competitor_advantages[:3])}
                    </ul>
                    <p><strong>Don't let them steal your customers!</strong></p>
                </div>
            </div>
        """
    
    def generate_weather_widget(self):
        """Generate weather widget for local feel"""
        if not self.business.weather:
            return ""
        
        return f"""
            <div class="weather-widget">
                <strong>{self.business.city}</strong><br>
                {self.business.weather['temp']}°F - {self.business.weather['description']}
            </div>
        """
    
    def calculate_personalization_score(self):
        """Calculate how personalized this demo is (0-100)"""
        score = 0
        
        # Base personalization
        if self.business.name: score += 10
        if self.business.phone: score += 5
        if self.business.address: score += 5
        
        # Enhanced data
        if self.business.rating > 0: score += 10
        if self.business.reviews: score += 10
        if self.business.hours: score += 5
        if self.business.services: score += 10
        if self.business.photos: score += 10
        
        # Competition analysis
        if self.business.competitors: score += 10
        if self.business.competitor_advantages: score += 5
        
        # Local elements
        if self.business.weather: score += 5
        if self.business.landmarks: score += 5
        
        # AI content
        if hasattr(self.business, 'hero_content'): score += 10
        
        return min(score, 100)
    
    def generate_insights_report(self):
        """Generate insights for follow-up"""
        insights = {
            'personalization_score': self.calculate_personalization_score(),
            'key_selling_points': [],
            'follow_up_angles': [],
            'urgency_factors': self.business.urgency_factors,
            'competitor_situation': None
        }
        
        # Key selling points based on data
        if self.business.rating >= 4.5:
            insights['key_selling_points'].append(
                f"Strong {self.business.rating}★ reputation needs online presence"
            )
        
        if self.business.missed_customers > 100:
            insights['key_selling_points'].append(
                f"Missing {self.business.missed_customers}+ potential customers monthly"
            )
        
        if self.business.competitors:
            web_competitors = sum(1 for c in self.business.competitors if c.get('has_website'))
            if web_competitors > 2:
                insights['competitor_situation'] = 'urgent'
                insights['follow_up_angles'].append(
                    f"{web_competitors} competitors already capturing online customers"
                )
        
        # Revenue opportunity
        min_rev, max_rev = self.business.revenue_potential
        if min_rev > 5000:
            insights['follow_up_angles'].append(
                f"Potential ${min_rev:,}-${max_rev:,}/month in new revenue"
            )
        
        return insights


# Demo generation function
def generate_smart_demo(business_data):
    """Generate a smart demo for a business"""
    generator = SmartDemoGenerator(business_data)
    return generator.generate_smart_demo()


if __name__ == "__main__":
    # Test with sample business
    test_business = {
        'name': "Bob's Plumbing",
        'phone': '(207) 555-1234',
        'address': '123 Main St, Camden, ME',
        'city': 'Camden',
        'state': 'ME',
        'zip_code': '04843',
        'category': 'Plumber',
        'place_id': 'ChIJxxxxxxxxxxxxxx'  # Would be real Google place ID
    }
    
    result = generate_smart_demo(test_business)
    print(f"\n✅ Demo generated!")
    print(f"URL: {result['demo_url']}")
    print(f"Personalization Score: {result['personalization_score']}%")
    print(f"Insights: {json.dumps(result['insights'], indent=2)}")
