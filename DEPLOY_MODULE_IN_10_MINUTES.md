# ⚡ Deploy Squarespace Module in 10 Minutes (Free!)

## Use GitHub Pages - It's Free & Fast

### Step 1: Create GitHub Repository (2 min)
```bash
# In your terminal:
cd ~/Desktop
mkdir pleasant-cove-workspace
cd pleasant-cove-workspace

# Copy module files
cp ~/Desktop/pleasantcovedesign/pleasantcovedesign/workspace-module/* .

# Initialize git
git init
git add .
git commit -m "Initial workspace module"
```

### Step 2: Push to GitHub (2 min)
1. Go to https://github.com/new
2. Create repo named `pleasant-cove-workspace`
3. Push your code:
```bash
git remote add origin https://github.com/YOUR-USERNAME/pleasant-cove-workspace.git
git push -u origin main
```

### Step 3: Enable GitHub Pages (1 min)
1. Go to repo Settings → Pages
2. Source: Deploy from branch
3. Branch: main, folder: / (root)
4. Save

### Step 4: Update URLs in embed.js (2 min)
```javascript
// Change these lines in embed.js:
const BASE_URL = 'https://app.pleasantcovedesign.com';  // Your API
const CDN_URL = 'https://YOUR-USERNAME.github.io/pleasant-cove-workspace';
```

### Step 5: Commit & Push (1 min)
```bash
git add embed.js
git commit -m "Update URLs for production"
git push
```

### Step 6: Wait 2-5 minutes for GitHub to deploy

### Step 7: Give Customers This Code:
```html
<script src="https://YOUR-USERNAME.github.io/pleasant-cove-workspace/embed.js"></script>
<div id="pleasant-cove-workspace"></div>
```

---

## Even Faster Option: Use JSDelivr CDN

### No setup needed! Just use:
```html
<script src="https://cdn.jsdelivr.net/gh/YOUR-USERNAME/pleasant-cove-workspace@main/embed.js"></script>
<div id="pleasant-cove-workspace"></div>
```

---

## Still Missing: Backend API

The module will load but won't work without:
1. API endpoints (`/api/workspace/*`)
2. Database tables
3. Project-member linking

But at least customers can:
- See the module load
- Get a "no project found" message
- Know it's coming soon

---

## Or... Just Use the Portal 😉

Remember: `yourapp.com/clientportal/token` already works!
