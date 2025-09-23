// Quick script to create a test project for ben04537@gmail.com
// Run this with: node CREATE_TEST_PROJECT_FOR_BEN.js

// Use local API if testing locally, or production if deployed
const API_URL = 'http://localhost:3000'; // Change to production URL if needed
const ADMIN_TOKEN = 'pleasantcove2024admin';

async function createTestProject() {
  try {
    console.log('🚀 Creating test project for ben04537@gmail.com...\n');
    
    // Step 1: Create or get the company
    console.log('1️⃣ Creating company...');
    const companyResponse = await fetch(`${API_URL}/api/companies?token=${ADMIN_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ben Test Company',
        email: 'ben04537@gmail.com',
        phone: '555-0123',
        industry: 'general',
        priority: 'high',
        stage: 'client'
      })
    });
    
    const company = await companyResponse.json();
    console.log('✅ Company created:', company.name, '(ID:', company.id, ')');
    
    // Step 2: Create a project
    console.log('\n2️⃣ Creating project...');
    const projectResponse = await fetch(`${API_URL}/api/projects?token=${ADMIN_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: company.id,
        title: 'Website Development Project',
        type: 'website',
        stage: 'planning',
        status: 'active',
        notes: 'Test project for Squarespace module',
        progress: 25,
        totalAmount: 4997,
        paidAmount: 2500
      })
    });
    
    const project = await projectResponse.json();
    console.log('✅ Project created:', project.title);
    console.log('   Access Token:', project.accessToken || project.token);
    
    // Step 3: Grant client access
    if (project.id) {
      console.log('\n3️⃣ Granting client access...');
      const accessResponse = await fetch(`${API_URL}/api/projects/${project.id}/grant-access?token=${ADMIN_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: 'ben04537@gmail.com'
        })
      });
      
      const accessResult = await accessResponse.json();
      console.log('✅ Client access granted!');
      console.log('   Token:', accessResult.token);
    }
    
    console.log('\n🎉 SUCCESS! Project created for ben04537@gmail.com');
    console.log('\n📋 Next steps:');
    console.log('1. Go back to your Squarespace page');
    console.log('2. Refresh the page');
    console.log('3. The project workspace should now load!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run it!
createTestProject();
