# 🎯 Project Workspace as a Squarespace Module

## Current State vs. Desired State

### Current State ❌
- Single HTML file with everything embedded
- Requires manual Squarespace setup
- Not easily distributable
- Hard to update across multiple sites

### Desired State ✅
- Single-line embed code
- Auto-configures from Squarespace context
- Hosted on your servers
- Updates automatically for all clients

---

## The Solution: True Module Architecture

### 1. **Single Embed Code**
What clients add to their Squarespace:
```html
<!-- Pleasant Cove Design Project Workspace -->
<script src="https://pleasantcovedesign.com/workspace/embed.js" 
        data-api="https://api.pleasantcovedesign.com"></script>
<div id="pleasant-cove-workspace"></div>
```

That's it! Everything else is automatic.

### 2. **Module Structure**
```
pleasantcovedesign.com/workspace/
├── embed.js           # Main loader script
├── workspace.js       # Core module code
├── workspace.css      # Styles
├── assets/           # Icons, images
└── config.js         # Configuration
```

### 3. **How It Works**

#### Step 1: Embed Loader (`embed.js`)
```javascript
(function() {
    // Auto-detect Squarespace environment
    const detectSquarespaceMember = () => {
        // Check multiple sources
        const sources = [
            () => window.Static?.SQUARESPACE_CONTEXT?.authenticatedAccount,
            () => JSON.parse(getCookie('SiteUserInfo') || '{}'),
            () => document.querySelector('[data-member-id]')?.dataset.memberId
        ];
        
        for (let source of sources) {
            try {
                const result = source();
                if (result) return result;
            } catch (e) {}
        }
        return null;
    };
    
    // Load resources
    const loadWorkspace = () => {
        // Inject CSS
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://pleasantcovedesign.com/workspace/workspace.css';
        document.head.appendChild(css);
        
        // Load Socket.IO
        const io = document.createElement('script');
        io.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
        document.head.appendChild(io);
        
        // Load main module
        io.onload = () => {
            const script = document.createElement('script');
            script.src = 'https://pleasantcovedesign.com/workspace/workspace.js';
            script.onload = () => {
                // Initialize with config
                window.PleasantCoveWorkspace.init({
                    container: 'pleasant-cove-workspace',
                    api: document.currentScript.dataset.api,
                    member: detectSquarespaceMember()
                });
            };
            document.head.appendChild(script);
        };
    };
    
    // Start loading
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadWorkspace);
    } else {
        loadWorkspace();
    }
})();
```

#### Step 2: Core Module (`workspace.js`)
```javascript
window.PleasantCoveWorkspace = {
    config: null,
    socket: null,
    
    init(config) {
        this.config = config;
        
        // Check member authentication
        if (!config.member) {
            this.showLoginPrompt();
            return;
        }
        
        // Load project data
        this.loadProject();
    },
    
    async loadProject() {
        try {
            // Get project for this member
            const response = await fetch(`${this.config.api}/api/workspace/member/${this.config.member.id}`);
            const data = await response.json();
            
            if (data.project) {
                this.renderWorkspace(data);
                this.connectWebSocket(data.project.token);
            } else {
                this.showNoProject();
            }
        } catch (error) {
            this.showError('Unable to load project');
        }
    },
    
    renderWorkspace(data) {
        const container = document.getElementById(this.config.container);
        container.innerHTML = this.getWorkspaceHTML(data);
        this.attachEventListeners();
    },
    
    // ... rest of the module code
};
```

---

## Implementation Steps

### 1. **Create Module Bundle**
```javascript
// build-workspace-module.js
const fs = require('fs');
const path = require('path');

// Combine all components
const embedLoader = fs.readFileSync('./src/embed-loader.js', 'utf8');
const workspaceCore = fs.readFileSync('./src/workspace-core.js', 'utf8');
const styles = fs.readFileSync('./src/workspace.css', 'utf8');

// Minify and bundle
const bundle = {
    'embed.js': minify(embedLoader),
    'workspace.js': minify(workspaceCore),
    'workspace.css': minify(styles)
};

// Deploy to CDN/server
Object.entries(bundle).forEach(([file, content]) => {
    fs.writeFileSync(`./dist/${file}`, content);
});
```

### 2. **Server Endpoints**
```javascript
// New API endpoints needed
app.get('/api/workspace/member/:memberId', async (req, res) => {
    const { memberId } = req.params;
    
    // Find project associated with this Squarespace member
    const project = await db.query(`
        SELECT p.*, pmc.access_level 
        FROM projects p
        JOIN project_member_contexts pmc ON p.id = pmc.project_id
        WHERE pmc.squarespace_member_id = ?
    `, [memberId]);
    
    res.json({ project: project[0] || null });
});

app.post('/api/workspace/feedback', authenticateMember, async (req, res) => {
    // Handle feedback from workspace
});

app.get('/api/workspace/messages/:projectId', authenticateMember, async (req, res) => {
    // Get messages for this member only
});
```

### 3. **CDN/Hosting Setup**
```nginx
# Nginx config for workspace module
location /workspace/ {
    alias /var/www/pleasantcovedesign/workspace-module/;
    
    # CORS headers for Squarespace
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST";
    
    # Cache static assets
    location ~ \.(js|css|png|jpg)$ {
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Benefits of This Architecture

### For You:
1. **One-time setup** - Deploy once, works everywhere
2. **Central updates** - Fix bugs or add features instantly for all clients
3. **Analytics** - Track usage across all installations
4. **Version control** - Roll back if needed

### For Clients:
1. **Simple installation** - Just paste embed code
2. **No maintenance** - Always gets latest version
3. **Squarespace native** - Feels like part of their site
4. **Responsive** - Works on all devices

### Security:
1. **Member isolation** - Each member sees only their data
2. **Token-based auth** - Secure API communication
3. **CORS protection** - Only works from authorized domains
4. **SSL required** - All communication encrypted

---

## Testing the Module

### 1. **Local Testing**
```html
<!-- test-squarespace.html -->
<html>
<head>
    <script>
        // Mock Squarespace environment
        window.Static = {
            SQUARESPACE_CONTEXT: {
                authenticatedAccount: {
                    id: 'test-member-123',
                    email: 'test@example.com'
                }
            }
        };
    </script>
</head>
<body>
    <!-- Test embed -->
    <script src="http://localhost:3000/workspace/embed.js" 
            data-api="http://localhost:3000"></script>
    <div id="pleasant-cove-workspace"></div>
</body>
</html>
```

### 2. **Production Testing**
1. Create test Squarespace site
2. Add member area
3. Embed module code
4. Test all features

---

## Migration Path

### Phase 1: Package Current Module
1. Extract CSS to separate file
2. Split JS into loader + core
3. Create build process
4. Test locally

### Phase 2: Add API Endpoints
1. Member authentication endpoint
2. Project lookup by member
3. Isolated data access
4. WebSocket authentication

### Phase 3: Deploy & Test
1. Deploy to production server
2. Set up CDN/caching
3. Test on real Squarespace site
4. Monitor performance

### Phase 4: Client Migration
1. Update documentation
2. Create migration guide
3. Notify existing clients
4. Provide support

---

## Quick Start Commands

```bash
# Build the module
npm run build:workspace-module

# Deploy to production
npm run deploy:workspace-module

# Test locally
npm run test:workspace-module

# Generate embed code for client
npm run generate:embed-code --client="ACME Corp"
```

---

## The Result

Your clients get a professional, integrated experience with just:
```html
<script src="https://pleasantcovedesign.com/workspace/embed.js"></script>
<div id="pleasant-cove-workspace"></div>
```

Everything else is automatic! 🎯
