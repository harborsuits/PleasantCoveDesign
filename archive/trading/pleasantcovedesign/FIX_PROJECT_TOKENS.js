// Script to add missing access tokens to all projects
// Run this to fix the null token issue in your admin UI

const API_URL = 'http://localhost:3000'; // or your production URL
const ADMIN_TOKEN = 'pleasantcove2024admin';

async function fixMissingTokens() {
  try {
    console.log('🔧 Fetching all projects...');
    
    // Get all projects
    const projectsResponse = await fetch(`${API_URL}/api/projects?token=${ADMIN_TOKEN}`);
    const projects = await projectsResponse.json();
    
    console.log(`📊 Found ${projects.length} projects`);
    
    let fixed = 0;
    
    for (const project of projects) {
      if (!project.accessToken && !project.token && !project.clientToken) {
        console.log(`❌ Project ${project.id} "${project.title}" has no token`);
        
        // Generate a token for this project
        const tokenResponse = await fetch(`${API_URL}/api/projects/${project.id}/generate-token?token=${ADMIN_TOKEN}`, {
          method: 'POST'
        });
        
        if (tokenResponse.ok) {
          const result = await tokenResponse.json();
          console.log(`✅ Generated token for project ${project.id}: ${result.token}`);
          fixed++;
        } else {
          console.log(`⚠️ Failed to generate token for project ${project.id}`);
        }
      }
    }
    
    console.log(`\n✨ Fixed ${fixed} projects with missing tokens`);
    console.log('🎯 Refresh your admin UI and projects should open correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run it!
fixMissingTokens();
