# 🚀 Quick Project Setup for ben04537@gmail.com

## The Issue:
Your Squarespace module can't find a project because there's no project associated with `ben04537@gmail.com`.

## Solution: Create a Project in Your Admin UI

### Option 1: Quick Manual Steps (Recommended)

1. **Open your Admin UI**
   - Go to http://localhost:3001 (or wherever your admin is running)

2. **Go to Clients Page**
   - Click "Clients" in the sidebar
   - Click the "+" button to add a new client

3. **Create Client with Your Email**
   ```
   Company Name: Ben's Test Company
   Email: ben04537@gmail.com  ← IMPORTANT! Must match exactly
   Phone: (optional)
   Industry: General
   ```
   - Click "Create Client"

4. **Create a Project**
   - After creating the client, you'll see it in the list
   - Click on the client
   - Click "Create Project" or similar button
   - Fill in:
     - Project Title: Website Development
     - Type: Website
     - Notes: Test project for Squarespace

5. **Grant Client Access**
   - In the project, go to Overview tab
   - Find "Client Access" section
   - Make sure email is set to: ben04537@gmail.com
   - Click "Grant Access" if needed

### Option 2: Use the API Directly

Run these commands in your terminal:

```bash
# 1. Create a company
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ben Test Company",
    "email": "ben04537@gmail.com",
    "phone": "555-0123",
    "stage": "client"
  }'

# Note the company ID from the response, then:

# 2. Create a project (replace COMPANY_ID)
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": COMPANY_ID,
    "title": "Website Development",
    "type": "website",
    "stage": "planning",
    "status": "active"
  }'
```

### Option 3: Quick SQL (if you have database access)

```sql
-- Insert company
INSERT INTO companies (name, email, stage, created_at) 
VALUES ('Ben Test Company', 'ben04537@gmail.com', 'client', NOW());

-- Get the company ID
SELECT id FROM companies WHERE email = 'ben04537@gmail.com';

-- Insert project (replace COMPANY_ID)
INSERT INTO projects (company_id, title, type, stage, status, created_at)
VALUES (COMPANY_ID, 'Website Development', 'website', 'planning', 'active', NOW());
```

## 🎯 After Creating the Project:

1. **Refresh your Squarespace page**
2. The module should now find the project!
3. You'll see:
   - Overview with billing info
   - Design Canvas tab
   - Milestones tab
   - Files tab
   - Messages tab

## 🔍 Still Not Working?

Check these:
1. ✅ Email matches exactly: `ben04537@gmail.com`
2. ✅ Project status is `active` (not archived)
3. ✅ Company stage is `client` (not lead)
4. ✅ Your server is running

## 💡 Pro Tip:

For testing, you can also:
1. Change your Squarespace account email to match an existing project
2. Or use the token-based approach (append `?token=PROJECT_TOKEN` to URL)

The issue is simply that there's no project in the database for your email address. Once you create one, everything will work! 🚀
