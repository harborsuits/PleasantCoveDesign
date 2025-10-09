#!/usr/bin/env node

// Test script for Squarespace Lead Webhook
const testSquarespaceWebhook = async () => {
    const webhookUrl = 'http://localhost:3000/api/squarespace-webhook';

    // Sample Squarespace form submission payload
    const sampleLead = {
        formName: "Contact",
        pageUrl: "https://pleasantcovedesign.com/contact",
        fields: [
            { label: "Name", value: "Jane Smith" },
            { label: "Email", value: "jane.smith@example.com" },
            { label: "Phone", value: "555-987-6543" },
            { label: "Company", value: "Smith Web Solutions" },
            { label: "Message", value: "Hi, I'm interested in a new website for my business. Can we schedule a consultation?" }
        ],
        memberId: "sq-member-123", // Optional - if logged in member
        memberEmail: "jane.smith@example.com"
    };

    console.log('🧪 Testing Squarespace webhook with sample lead data...');
    console.log('📋 Sample lead:', JSON.stringify(sampleLead, null, 2));

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Squarespace-Webhooks/1.0'
            },
            body: JSON.stringify(sampleLead)
        });

        const result = await response.text();

        console.log('📬 Response Status:', response.status);
        console.log('📄 Response Body:', result);

        if (response.ok) {
            console.log('✅ Webhook test PASSED!');
            const parsed = JSON.parse(result);
            if (parsed.company_id) {
                console.log('🏢 Company created/updated with ID:', parsed.company_id);
            }
            if (parsed.project_token) {
                console.log('🎫 Project token:', parsed.project_token);
                console.log('🔗 Client can access their project at:');
                console.log(`   http://localhost:5173/public/project/${parsed.project_token}`);
            }
        } else {
            console.log('❌ Webhook test FAILED!');
        }

    } catch (error) {
        console.error('💥 Test error:', error.message);
        console.log('❌ Make sure your server is running on port 3000');
    }
};

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

testSquarespaceWebhook();
