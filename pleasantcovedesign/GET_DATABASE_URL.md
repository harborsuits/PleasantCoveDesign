# Getting Your Railway PostgreSQL External URL

The URL you provided:
```
postgresql://postgres:grSQhnpEYeJJnfmskxenjJVVzUcSsgzA@postgres.railway.internal:5432/railway
```

This is the INTERNAL URL that only works from within Railway. You need the EXTERNAL URL.

## How to Get the External URL:

1. Go to https://railway.app
2. Open your Pleasant Cove Design project
3. Click on your Postgres service (database icon)
4. Go to the **"Connect"** tab
5. Look for **"Postgres Connection URL"** (NOT the internal one)
6. It should look like:
   ```
   postgresql://postgres:grSQhnpEYeJJnfmskxenjJVVzUcSsgzA@[something].railway.app:5432/railway
   ```
   Note the `.railway.app` domain instead of `.railway.internal`

## Alternative: Use Railway CLI

If you have Railway CLI set up:
```bash
railway login
railway link
railway connect postgres
```

This will give you a local connection to your database.

Once you have the external URL, run:
```bash
cd /Users/bendickinson/Desktop/pleasantcovedesign
source venv/bin/activate
python pleasantcovedesign/setup_database.py 'YOUR_EXTERNAL_DATABASE_URL'
```
