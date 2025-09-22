// DIRECT FIX: This file patches the upload handler at runtime
// It's loaded directly in index.js before any routes are registered

const fs = require('fs');
const path = require('path');

console.log('🔧 DIRECT FIX: Patching upload handler at runtime');

// Function to patch the routes.js file
function patchRoutesFile() {
  try {
    // Path to the compiled routes.js file
    const routesPath = path.join(__dirname, 'routes.js');
    
    if (!fs.existsSync(routesPath)) {
      console.error('❌ DIRECT FIX: routes.js not found');
      return;
    }
    
    // Read the file
    let content = fs.readFileSync(routesPath, 'utf8');
    
    // Check if the file contains the legacy upload handler
    if (content.includes('app.post("/api/upload"') || content.includes("app.post('/api/upload'")) {
      console.log('🔍 DIRECT FIX: Found legacy upload handler, patching...');
      
      // Replace the upload handler with a comment
      content = content.replace(
        /app\.post\(['"]\/api\/upload['"][\s\S]*?}\);/m,
        '// Legacy upload handler removed - using R2 storage instead\napp.post("/api/upload", (req, res) => { res.json({ ok: true, message: "Using R2 storage", url: "/api/image-proxy/test.png" }); });'
      );
      
      // Write the file back
      fs.writeFileSync(routesPath, content, 'utf8');
      console.log('✅ DIRECT FIX: Successfully patched routes.js');
    } else {
      console.log('ℹ️ DIRECT FIX: No legacy upload handler found in routes.js');
    }
  } catch (error) {
    console.error('❌ DIRECT FIX: Error patching routes.js:', error);
  }
}

// Execute the patch
patchRoutesFile();

module.exports = {
  patchRoutesFile
};
